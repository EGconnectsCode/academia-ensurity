// @ts-nocheck
// Supabase Edge Function — proxies registration data to Bitrix24 CRM

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  try {
    const { name, email, phone, course } = await req.json();
    const webhookUrl = Deno.env.get('BITRIX_WEBHOOK_URL');

    if (!webhookUrl) {
      return new Response(JSON.stringify({ error: 'BITRIX_WEBHOOK_URL not set' }), {
        status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const res = await fetch(`${webhookUrl}crm.lead.add.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          NAME:      name,
          EMAIL:     [{ VALUE: email, VALUE_TYPE: 'WORK' }],
          PHONE:     [{ VALUE: phone, VALUE_TYPE: 'MOBILE' }],
          COMMENTS:  `Course interest: ${course || 'not specified'}`,
          SOURCE_ID: 'ACADEMIA',
        },
      }),
    });

    const data = await res.json();
    return new Response(JSON.stringify({ ok: true, bitrix: data }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
