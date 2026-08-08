// Vercel serverless function — receives the Bitrix24 "local application" install/open
// POST (DOMAIN, AUTH_ID, member_id, etc.), verifies the caller against Bitrix's own
// REST API using that AUTH_ID, and issues a Supabase session for the matching agent
// profile — this is what makes "open the app from inside Bitrix" behave as SSO.
//
// Client ID/Secret are set (Vercel env vars, Production) — the local application is
// registered in Bitrix24. Still pending before this is a real SSO flow:
//   1. A live test open from inside Bitrix, to confirm the actual field name Bitrix
//      uses for department on the user.current payload (varies by portal setup).
//   2. Deciding how a profile gets tagged "internal EG agent" (vs external AOR) —
//      this depends on the still-open access-restriction design, not just this file.
//   3. Actually issuing the Supabase session (service-role admin API) once 1 and 2
//      are settled — until then this intentionally stops at verifying identity only.
const BITRIX_CLIENT_ID = process.env.BITRIX_CLIENT_ID;
const BITRIX_CLIENT_SECRET = process.env.BITRIX_CLIENT_SECRET;

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
  if (req.method !== 'POST') {
    res.status(405).send('POST required — Bitrix opens local apps via POST');
    return;
  }
  if (!BITRIX_CLIENT_ID || !BITRIX_CLIENT_SECRET) {
    res.status(500).send('BITRIX_CLIENT_ID/SECRET not configured');
    return;
  }

  const { DOMAIN, AUTH_ID, REFRESH_ID, member_id } = req.body || {};
  if (!DOMAIN || !AUTH_ID) {
    res.status(400).send('Missing DOMAIN or AUTH_ID from Bitrix');
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

  // TODO: once a live payload has been inspected and the access-restriction design
  // is settled — look up/create the Supabase profile for bxUser.EMAIL, tag it as an
  // internal EG agent, generate a Supabase session, and hand it back to the front end.
  res.status(501).json({
    error: 'Bitrix identity verified, but Supabase session hand-off is not implemented yet',
    bitrixUser: { email: bxUser.EMAIL, name: bxUser.NAME, department: bxUser.UF_DEPARTMENT || null },
  });
};
