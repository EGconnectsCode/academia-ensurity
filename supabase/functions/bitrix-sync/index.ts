// @ts-nocheck
// Supabase Edge Function — proxies registration data to Bitrix24 CRM
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Bitrix deal custom field — course interests (multi-select IDs)
const BITRIX_COURSES_FIELD = 'UF_CRM_1766001845';
// Bitrix contact custom field — temporary password-reset code
const BITRIX_RESET_CODE_FIELD = 'UF_CRM_1783613073';

// Bitrix list item ID → module slug
const BITRIX_TO_MODULE: Record<string, string> = {
  '38384': 'cica',
  '38452': 'gtl',
  '44454': 'american-amicable',
  '39136': 'liberty-bankers',
  '38378': 'corebr',
};

function adminClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function bxCall(webhookUrl: string, method: string, params: unknown) {
  const res = await fetch(`${webhookUrl}${method}.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  return res.json();
}

function jsonResp(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

// Shared code check for both password_reset_verify and password_reset_complete —
// centralized so brute-force attempts against either endpoint count against the
// same lockout, and so no caller can retry indefinitely (this endpoint has
// verify_jwt = false, i.e. it is fully public with no auth of its own).
const MAX_CODE_ATTEMPTS = 5;

async function checkResetCode(db: ReturnType<typeof createClient>, email: string, code: string) {
  const { data: row } = await db
    .from('password_reset_codes')
    .select('id, code, expires_at, used, attempts')
    .eq('email', email)
    .eq('used', false)
    .single();

  if (!row) return { valid: false, reason: 'not_found' as const, row: null };
  if (new Date(row.expires_at) < new Date()) return { valid: false, reason: 'expired' as const, row };
  if ((row.attempts || 0) >= MAX_CODE_ATTEMPTS) return { valid: false, reason: 'locked' as const, row };

  if (row.code !== String(code)) {
    await db.from('password_reset_codes').update({ attempts: (row.attempts || 0) + 1 }).eq('id', row.id);
    return { valid: false, reason: 'wrong_code' as const, row };
  }
  return { valid: true, reason: null, row };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const body = await req.json();
    const webhookUrl = Deno.env.get('BITRIX_WEBHOOK_URL');

    if (!webhookUrl) return jsonResp({ error: 'BITRIX_WEBHOOK_URL not set' }, 500);

    // ── Get course interests for a registered user from Bitrix ──────────────
    if (body.action === 'get_courses_by_email') {
      const email: string = body.email || '';
      if (!email) return jsonResp({ modules: [] });

      const contactRes = await bxCall(webhookUrl, 'crm.contact.list', {
        filter: { EMAIL: email },
        select: ['ID'],
      });
      const contacts: Array<{ ID: string }> = contactRes.result || [];
      if (!contacts.length) return jsonResp({ modules: [] });

      // Search deals across ALL contacts with this email (duplicates are common)
      let deals: Array<Record<string, unknown>> = [];
      for (const contact of contacts) {
        const dealRes = await bxCall(webhookUrl, 'crm.deal.list', {
          filter: { CONTACT_ID: contact.ID },
          select: ['ID', BITRIX_COURSES_FIELD],
          order: { DATE_CREATE: 'DESC' },
        });
        const found = (dealRes.result || []).filter((d: Record<string, unknown>) =>
          Array.isArray(d[BITRIX_COURSES_FIELD]) && (d[BITRIX_COURSES_FIELD] as string[]).length > 0
        );
        if (found.length) { deals = found; break; }
      }
      if (!deals.length) return jsonResp({ modules: [] });

      const courseIds: string[] = (deals[0][BITRIX_COURSES_FIELD] as string[]) || [];
      const modules = courseIds.map((id) => BITRIX_TO_MODULE[String(id)]).filter(Boolean);
      return jsonResp({ modules });
    }

    // ── Password reset — Step 1: generate and send code ────────────────────
    if (body.action === 'password_reset_request') {
      const { email } = body;
      if (!email) return jsonResp({ error: 'Email required' }, 400);

      const db = adminClient();

      // Verify the user has a Supabase account first
      const { data: profile } = await db.from('profiles').select('id').eq('email', email).single();
      if (!profile) {
        return jsonResp({ error: 'No account found with that email.' }, 404);
      }

      // 1. Try Bitrix Contact
      const contactRes = await bxCall(webhookUrl, 'crm.contact.list', {
        filter: { EMAIL: email },
        select: ['ID'],
      });
      const contacts = contactRes.result || [];

      // 2. Try Bitrix Lead if no Contact found
      let bxEntity: 'contact' | 'lead' | null = null;
      let bxEntityId: string | null = null;

      if (contacts.length) {
        bxEntity   = 'contact';
        bxEntityId = contacts[0].ID;
      } else {
        const leadRes = await bxCall(webhookUrl, 'crm.lead.list', {
          filter: { EMAIL: email },
          select: ['ID'],
          order: { DATE_CREATE: 'DESC' },
        });
        const leads = leadRes.result || [];
        if (leads.length) {
          bxEntity   = 'lead';
          bxEntityId = leads[0].ID;
        }
      }

      // 3. No Bitrix record at all — fall back to Supabase native reset email
      if (!bxEntity) {
        const anonDb = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        );
        await anonDb.auth.resetPasswordForEmail(email, {
          redirectTo: 'https://academia-ensurity.vercel.app/reset-password',
        });
        return jsonResp({ ok: true, method: 'email' });
      }

      // Generate 6-digit code, expires in 30 min
      const code = String(Math.floor(100000 + Math.random() * 900000));
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

      // Save code to Supabase
      await db.from('password_reset_codes').delete().eq('email', email);
      const { error: insertErr } = await db
        .from('password_reset_codes')
        .insert({ email, code, expires_at: expiresAt });
      if (insertErr) throw new Error(insertErr.message);

      // Clear field first so Bitrix automation fires every time (empty → value triggers it)
      const updateMethod = bxEntity === 'contact' ? 'crm.contact.update' : 'crm.lead.update';
      await bxCall(webhookUrl, updateMethod, {
        id: bxEntityId,
        fields: { [BITRIX_RESET_CODE_FIELD]: '' },
      });
      // Small pause so Bitrix registers the change before writing the new code
      await new Promise(resolve => setTimeout(resolve, 1500));
      await bxCall(webhookUrl, updateMethod, {
        id: bxEntityId,
        fields: { [BITRIX_RESET_CODE_FIELD]: code },
      });

      return jsonResp({ ok: true, method: 'bitrix' });
    }

    // ── Password reset — Step 2: verify code ───────────────────────────────
    if (body.action === 'password_reset_verify') {
      const { email, code } = body;
      if (!email || !code) return jsonResp({ valid: false, reason: 'missing_fields' });

      const db = adminClient();
      const result = await checkResetCode(db, email, String(code));
      return jsonResp({ valid: result.valid, reason: result.reason || undefined });
    }

    // ── Password reset — Step 3: update password and clear code ────────────
    if (body.action === 'password_reset_complete') {
      const { email, code, newPassword } = body;
      if (!email || !code || !newPassword) {
        return jsonResp({ error: 'Missing fields' }, 400);
      }

      const db = adminClient();

      // Verify code one last time (shares the attempt counter/lockout with password_reset_verify)
      const result = await checkResetCode(db, email, String(code));
      if (!result.valid) {
        return jsonResp({ error: 'Invalid or expired code.' }, 400);
      }

      // Find user in profiles table
      const { data: profile } = await db
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (!profile) return jsonResp({ error: 'User not found.' }, 404);

      // Update password via admin API
      const { error: updateErr } = await db.auth.admin.updateUserById(profile.id, {
        password: newPassword,
      });
      if (updateErr) throw new Error(updateErr.message);

      // Mark code as used
      await db.from('password_reset_codes').update({ used: true }).eq('email', email);

      // Clear Bitrix field — try contact first, then lead
      const cRes = await bxCall(webhookUrl, 'crm.contact.list', { filter: { EMAIL: email }, select: ['ID'] });
      if ((cRes.result || []).length) {
        await bxCall(webhookUrl, 'crm.contact.update', { id: cRes.result[0].ID, fields: { [BITRIX_RESET_CODE_FIELD]: '' } });
      } else {
        const lRes = await bxCall(webhookUrl, 'crm.lead.list', { filter: { EMAIL: email }, select: ['ID'], order: { DATE_CREATE: 'DESC' } });
        if ((lRes.result || []).length) {
          await bxCall(webhookUrl, 'crm.lead.update', { id: lRes.result[0].ID, fields: { [BITRIX_RESET_CODE_FIELD]: '' } });
        }
      }

      return jsonResp({ ok: true });
    }

    // ── Default: create lead in Bitrix (new agent registration) ────────────
    const { name, email, phone, course } = body;
    const res = await fetch(`${webhookUrl}crm.lead.add.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          NAME:      name,
          EMAIL:     [{ VALUE: email, VALUE_TYPE: 'WORK' }],
          PHONE:     [{ VALUE: phone, VALUE_TYPE: 'MOBILE' }],
          COMMENTS:  course ? `Course interest: ${course}` : 'New registration',
          SOURCE_ID: 'ACADEMIA',
        },
      }),
    });
    const data = await res.json();
    return jsonResp({ ok: true, bitrix: data });

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return jsonResp({ error: msg }, 500);
  }
});
