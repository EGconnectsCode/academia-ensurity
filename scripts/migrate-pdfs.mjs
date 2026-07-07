/**
 * migrate-pdfs.mjs
 * Extracts base64-embedded PDFs from module HTML files,
 * uploads them to Supabase Storage, and replaces the
 * base64 content with public Supabase URLs.
 *
 * Usage:  node scripts/migrate-pdfs.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const SUPABASE_URL     = 'https://qvamdopwbjlccazchoer.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2YW1kb3B3YmpsY2NhemNob2VyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjMxMDg4NCwiZXhwIjoyMDk3ODg2ODg0fQ.txlLgl1gTL66usTZs0aRDsSbgfIgYHd78cqjsjNjVqI';

const MODULES = [
  {
    htmlPath: resolve('modules/corebr/COREBR_1.html'),
    bucket:   'pdfs-corebr',
  },
  {
    htmlPath: resolve('modules/liberty-bankers/liberty-bankers.html'),
    bucket:   'pdfs-liberty-bankers',
  },
];

// ── Supabase helpers ────────────────────────────────────────────────────────

async function ensureBucket(bucket) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: bucket, name: bucket, public: true }),
  });
  const body = await res.json();
  if (res.ok || body.error === 'Bucket already exists') {
    console.log(`  bucket: ${bucket} ✓`);
  } else {
    throw new Error(`Failed to create bucket ${bucket}: ${JSON.stringify(body)}`);
  }
}

async function uploadPdf(bucket, filename, pdfBuffer) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${filename}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/pdf',
      'x-upsert': 'true',
    },
    body: pdfBuffer,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`Upload failed for ${filename}: ${JSON.stringify(body)}`);
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${filename}`;
}

// ── Main ────────────────────────────────────────────────────────────────────

const PDF_TAG_RE = /<script\s+type="application\/pdf"\s+id="(pdf_[^"]+)">([\s\S]*?)<\/script>/g;

for (const mod of MODULES) {
  console.log(`\n=== Processing ${mod.bucket} ===`);
  console.log(`  Reading: ${mod.htmlPath}`);

  let html = readFileSync(mod.htmlPath, 'utf8');

  await ensureBucket(mod.bucket);

  const matches = [...html.matchAll(PDF_TAG_RE)];
  console.log(`  Found ${matches.length} PDF tags`);

  if (matches.length === 0) {
    console.log('  Nothing to migrate.');
    continue;
  }

  let updated = html;
  let ok = 0, fail = 0;

  for (const [fullMatch, id, b64raw] of matches) {
    const b64 = b64raw.replace(/[\s\r\n]/g, '');

    // Already a URL (shouldn't happen but skip safely)
    if (b64.startsWith('https://')) {
      console.log(`  skip (already URL): ${id}`);
      continue;
    }

    const filename = id.replace(/^pdf_/, '') + '.pdf';
    try {
      const pdfBuffer = Buffer.from(b64, 'base64');
      const url = await uploadPdf(mod.bucket, filename, pdfBuffer);
      // Replace entire script tag content with the URL
      updated = updated.replace(
        fullMatch,
        `<script type="application/octet-stream" id="${id}">${url}</script>`
      );
      console.log(`  ✓ ${filename} → ${url.split('/').pop()}`);
      ok++;
    } catch (err) {
      console.error(`  ✗ ${filename}: ${err.message}`);
      fail++;
    }
  }

  if (ok > 0) {
    writeFileSync(mod.htmlPath, updated, 'utf8');
    console.log(`  Saved updated HTML (${ok} migrated, ${fail} failed)`);
  }
}

console.log('\nDone.');
