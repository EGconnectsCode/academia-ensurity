// Vercel serverless function — receives the Bitrix24 "local application" install/open
// POST (DOMAIN, AUTH_ID, member_id, etc.), verifies the caller against Bitrix's own
// REST API using that AUTH_ID, then mints a real Supabase session for the matching
// agent profile (creating it on first login) and redirects the browser into it —
// this is what makes "open the app from inside Bitrix" behave as SSO.
const BITRIX_CLIENT_ID = process.env.BITRIX_CLIENT_ID;
const BITRIX_CLIENT_SECRET = process.env.BITRIX_CLIENT_SECRET;
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qvamdopwbjlccazchoer.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SITE_URL = process.env.SITE_URL || 'https://academia-ensurity.vercel.app';

// Explicit allowlist — only these Bitrix accounts may SSO into the Academia.
// Confirmed by name lookup against Bitrix on 2026-08-11; spans several
// departments (Life/Sales Life plus a few individual approvals), so this is
// a flat email list rather than a department-based rule.
const ALLOWED_BITRIX_EMAILS = [
  'yohanni.beltre@ensuritygroup.com',
  'fany.rojas@ensuritygroup.com',
  'zeilic.hernandez@ensuritygroup.com',
  'lidiannny.reyes@ensuritygroup.com',
  'franklyn.almonte@ensuritygroup.com',
  'pedro.manzanillo@ensuritygroup.com',
  'chackie.polanco@ensuritygroup.com',
  'daniel.ramirez@ensuritygroup.com',
  'priscila.martinez@ensuritygroup.com',
  'elizabeth.celestino@ensuritygroup.com',
  'olider.veras@ensuritygroup.com',
  'mdc@ensuritygroup.com', // Maria Martinez
  'jhefersson.linares@egconnects.com',
  'ner.velasquez@mymedicareprogram.com',
  'deisy@ensuritygroup.com', // Deisy Castaño
  'nerfi.valenzuela@myhealthprograms.com',
  'hanz.krznaric@ensuritygroup.com',
  'operations@ensuritygroup.com', // Moe Flores
  // Added 2026-08-17 — confirmed against Bitrix via the "Life Insurance" dept roster
  'ashley.amparo@ensuritygroup.com', // Ashley Amparo De Los Santos
  'crystal.torres@ensuritygroup.com', // Crystal Torres Segura
  'aliana.perez@ensuritygroup.com', // Eliana Altagracia Perez Sanchez — Bitrix email spells it "aliana"
  'teodairin.rodriguez@ensuritygroup.com', // Teodairin Rodriguez Matos
  'yeremy.calzado@ensuritygroup.com', // Yeremy Jorge Calzado Tejeda
  'Mayely.Then@myhealthprograms.com', // Mayely Nicole Then Añazco — Bitrix first name shows as "Mayelin N."
];

function admin(path, opts = {}) {
  return fetch(`${SUPABASE_URL}${path}`, {
    ...opts,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });
}

// Finds the profile for this email, creating the auth user (and its
// auto-generated profile row, via the handle_new_user trigger) on first
// login, then tags it as an internal EG agent with an active status —
// Bitrix-authenticated agents skip the pending-approval flow entirely.
async function ensureInternalProfile(email, fullName) {
  let r = await admin(`/rest/v1/profiles?email=eq.${encodeURIComponent(email)}&select=id,agent_source,status`);
  let rows = await r.json();

  let profileId = rows[0] && rows[0].id;
  const isNew = !profileId;
  if (isNew) {
    const createRes = await admin('/auth/v1/admin/users', {
      method: 'POST',
      body: JSON.stringify({ email, email_confirm: true, user_metadata: { full_name: fullName } }),
    });
    const created = await createRes.json();
    if (!createRes.ok || !created.id) {
      throw new Error('Could not create Supabase user: ' + JSON.stringify(created));
    }
    profileId = created.id;
  } else if (rows[0].status === 'suspended') {
    // An admin blocked this account from the panel — never silently
    // resurrect it just because they opened the app from Bitrix again.
    throw new Error('This account has been blocked by an administrator.');
  }

  // eg_member is the pre-existing flag (an EG registration code, AA-only
  // signup path) that already gates internal-only dashboard content in
  // American Amicable — a Bitrix login is at least as strong a proof of
  // being EG staff, so it sets the same flag rather than introducing a
  // second, competing "is this person internal" signal.
  const patch = { agent_source: 'internal', eg_member: true, full_name: fullName };
  if (isNew) patch.status = 'active'; // only set on creation — never override an existing status
  await admin(`/rest/v1/profiles?id=eq.${profileId}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify(patch),
  });

  return profileId;
}

// Bitrix access tokens (AUTH_ID) expire — use REFRESH_ID + the app's client
// id/secret to get a fresh one instead of failing once the first token dies.
async function refreshToken(domain, refreshId) {
  const url = `https://oauth.bitrix.info/oauth/token/?grant_type=refresh_token`
    + `&client_id=${encodeURIComponent(BITRIX_CLIENT_ID)}`
    + `&client_secret=${encodeURIComponent(BITRIX_CLIENT_SECRET)}`
    + `&refresh_token=${encodeURIComponent(refreshId)}`;
  const r = await fetch(url);
  if (!r.ok) return null;
  return r.json(); // { access_token, refresh_token, domain, ... }
}

module.exports = async (req, res) => {
  // TEMP DEBUG — dump everything about the incoming request so we can see the
  // real field names/shape Bitrix actually sends, whatever the HTTP method.
  // Remove once the live payload has been inspected.
  if (req.query && req.query.debug === '1') {
    res.status(200).json({
      method: req.method,
      contentType: req.headers['content-type'] || null,
      query: req.query,
      body: req.body,
    });
    return;
  }

  if (!BITRIX_CLIENT_ID || !BITRIX_CLIENT_SECRET || !SUPABASE_SERVICE_ROLE_KEY) {
    res.status(500).send('Bitrix or Supabase credentials not configured');
    return;
  }

  const src = { ...(req.query || {}), ...(req.body || {}) };
  const DOMAIN     = src.DOMAIN     || src.domain;
  const AUTH_ID    = src.AUTH_ID    || src.auth_id    || src.auth;
  const REFRESH_ID = src.REFRESH_ID || src.refresh_id;
  if (!DOMAIN || !AUTH_ID) {
    res.status(400).json({
      error: 'Missing DOMAIN or AUTH_ID from Bitrix',
      method: req.method,
      contentType: req.headers['content-type'] || null,
      query: req.query,
      body: req.body,
    });
    return;
  }

  // Ask Bitrix who this is, using the token IT just gave us for THIS install/open event.
  async function fetchCurrentUser(authId) {
    const r = await fetch(`https://${DOMAIN}/rest/user.current.json?auth=${authId}`);
    return r.json();
  }

  let bxUser;
  try {
    let data = await fetchCurrentUser(AUTH_ID);
    if (data.error && REFRESH_ID) {
      const refreshed = await refreshToken(DOMAIN, REFRESH_ID);
      if (refreshed && refreshed.access_token) {
        data = await fetchCurrentUser(refreshed.access_token);
      }
    }
    bxUser = data.result;
  } catch (e) {
    res.status(502).send('Could not reach Bitrix REST API');
    return;
  }
  if (!bxUser || !bxUser.EMAIL) {
    res.status(502).send('Bitrix did not return a user with an email');
    return;
  }
  // Bitrix returns emails with whatever casing was typed in (e.g.
  // "Ner.Velasquez@..."), but Supabase auth/profiles store them lowercase —
  // comparing/looking up with the raw casing silently fails to find an
  // existing account and tries to create a duplicate instead. Normalize once
  // here and use this everywhere below, never bxUser.EMAIL directly.
  const email = bxUser.EMAIL.toLowerCase();
  if (!ALLOWED_BITRIX_EMAILS.includes(email)) {
    res.status(403).send('This Bitrix account is not authorized to access the Academia.');
    return;
  }

  try {
    await ensureInternalProfile(email, bxUser.NAME || email);

    const linkRes = await admin('/auth/v1/admin/generate_link', {
      method: 'POST',
      // Sends the browser to a dedicated callback page (not straight to the
      // dashboard) that explicitly awaits setSession() before navigating —
      // see bitrix-callback.html for why.
      body: JSON.stringify({ type: 'magiclink', email, redirect_to: `${SITE_URL}/bitrix-callback.html` }),
    });
    const linkData = await linkRes.json();
    if (!linkRes.ok || !linkData.action_link) {
      throw new Error('Could not generate Supabase session link: ' + JSON.stringify(linkData));
    }

    res.writeHead(302, { Location: linkData.action_link });
    res.end();
  } catch (e) {
    res.status(500).send('SSO sign-in failed: ' + e.message);
  }
};
