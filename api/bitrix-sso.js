// Vercel serverless function — receives the Bitrix24 "local application" install/open
// POST (DOMAIN, AUTH_ID, member_id, etc.), verifies the caller against Bitrix's own
// REST API using that AUTH_ID, and issues a Supabase session for the matching agent
// profile — this is what makes "open the app from inside Bitrix" behave as SSO.
//
// NOT WIRED YET — BITRIX_CLIENT_ID / BITRIX_CLIENT_SECRET env vars are still missing.
// Fill them in once the local application is registered in Bitrix24, then finish the
// TODOs below (this file intentionally stops short of writing to Supabase until the
// real Bitrix response shape has been checked against a live test call).

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('POST required — Bitrix opens local apps via POST');
    return;
  }

  const { DOMAIN, AUTH_ID, member_id } = req.body || {};
  if (!DOMAIN || !AUTH_ID) {
    res.status(400).send('Missing DOMAIN or AUTH_ID from Bitrix');
    return;
  }

  // Ask Bitrix who this is, using the token IT just gave us for THIS install/open event.
  let bxUser;
  try {
    const r = await fetch(`https://${DOMAIN}/rest/user.current.json?auth=${AUTH_ID}`);
    const data = await r.json();
    bxUser = data.result;
  } catch (e) {
    res.status(502).send('Could not reach Bitrix REST API');
    return;
  }
  if (!bxUser || !bxUser.EMAIL) {
    res.status(502).send('Bitrix did not return a user with an email');
    return;
  }

  // TODO once BITRIX_CLIENT_ID/SECRET are set and a live bxUser payload has been
  // inspected for the real department field name:
  //   1. Look up (or create) a Supabase profile for bxUser.EMAIL, tagged as an
  //      internal EG agent (not an external AOR) — likely a new profiles.source
  //      or profiles.agent_type column, set here.
  //   2. Generate a Supabase session for that user (service-role admin API) and
  //      hand it back so the front end can sign in without a password prompt.
  res.status(501).json({
    error: 'Bitrix identity verified, but Supabase session hand-off is not implemented yet',
    bitrixUser: { email: bxUser.EMAIL, name: bxUser.NAME, department: bxUser.UF_DEPARTMENT || null },
  });
};
