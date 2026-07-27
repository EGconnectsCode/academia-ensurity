// Forces a real same-origin download of PDFs hosted on third-party servers
// that send no CORS headers (e.g. software.gtlic.com for GTL's Agent Portal
// documents). A browser fetch() to those servers is always blocked by CORS,
// so the client can never get the bytes itself to trigger a save-as; this
// serverless function fetches server-side (no CORS restriction applies to
// server-to-server requests) and streams the file back with a
// Content-Disposition header that makes the browser download it for real.
const ALLOWED_HOSTS = ['software.gtlic.com'];

module.exports = async (req, res) => {
  const target = req.query.url;
  if (!target || typeof target !== 'string') {
    res.status(400).send('Missing url parameter');
    return;
  }

  let parsed;
  try {
    parsed = new URL(target);
  } catch (e) {
    res.status(400).send('Invalid url');
    return;
  }

  if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
    res.status(403).send('Host not allowed');
    return;
  }
  parsed.protocol = 'https:';

  let upstream;
  try {
    upstream = await fetch(parsed.toString());
  } catch (e) {
    res.status(502).send('Failed to fetch document');
    return;
  }
  if (!upstream.ok) {
    res.status(upstream.status).send('Upstream error');
    return;
  }

  const buf = Buffer.from(await upstream.arrayBuffer());
  const rawName = (typeof req.query.name === 'string' && req.query.name.trim())
    || parsed.pathname.split('/').pop()
    || 'document';
  const safeName = rawName.replace(/[^a-zA-Z0-9 _.-]/g, '').trim() || 'document';
  const filename = safeName.toLowerCase().endsWith('.pdf') ? safeName : safeName + '.pdf';

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="' + filename + '"');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.status(200).send(buf);
};
