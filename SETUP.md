# Academia Ensurity — Setup Guide

## What you have

```
academia-ensurity/
├── academia-ensurity.html          ← Landing page: unified login + module selector
├── admin/
│   └── admin-panel.html          ← Unified admin for all 3 modules
├── modules/
│   ├── allstate/
│   │   ├── allstate-academy.html ← Copy from: Academic dashboard/allstate-academy.html
│   │   └── allstate-patch.js     ← Supabase migration patch (add 3 lines to HTML)
│   ├── american-amicable/
│   │   ├── american-amicable.html← Copy from: Academic dashboard/american-amicable.html
│   │   └── aa-patch.js           ← Supabase migration patch
│   └── cica/
│       ├── cica-citizens-v2.html ← Copy from: Academic dashboard/cica-citizens-v2.html
│       └── cica-patch.js         ← Supabase migration patch
├── shared/
│   ├── supabase-config.js        ← Supabase client + all helpers (Auth, Progress, etc.)
│   └── auth-adapter.js           ← Generic adapter (used by patch files)
├── supabase/
│   ├── schema.sql                ← Run first in Supabase SQL Editor
│   ├── functions.sql             ← Run second in Supabase SQL Editor
│   └── seed.sql                  ← Instructions to create super-admin
├── vercel.json                   ← Deploy to Vercel (static hosting)
└── .env.example                  ← Environment variable template
```

---

## Step 1 — Create Supabase project

1. Go to https://supabase.com → New Project
2. Name: `academia-ensurity`
3. Region: `US East` (or nearest to your team)
4. Note your **Project URL** and **anon key** (Settings > API)

---

## Step 2 — Run database schema

In Supabase Dashboard → SQL Editor:

1. Copy + paste contents of `supabase/schema.sql` → Run
2. Copy + paste contents of `supabase/functions.sql` → Run
3. Verify: go to Table Editor — you should see: `modules`, `profiles`, `user_modules`, `progress`, `downloads`, `activity`, `sessions`

---

## Step 3 — Configure Supabase keys

Open `shared/supabase-config.js` and replace these two lines at the top:

```js
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';     // ← your URL
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';                   // ← your anon key
```

OR set them as environment variables in Vercel (recommended):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

And update `supabase-config.js` to read them:
```js
const SUPABASE_URL = window.ENV_SUPABASE_URL || 'https://YOUR_PROJECT.supabase.co';
```

---

## Step 4 — Configure Supabase Auth

In Supabase Dashboard → Authentication → Settings:

1. **Site URL**: `https://academia.zuritygroup.com` (or your Vercel URL)
2. **Redirect URLs**: add `https://academia.zuritygroup.com/**`
3. **Email Confirmations**: Enable (recommended for production)
4. **JWT Expiry**: 3600 (1 hour) or 86400 (24 hours)

---

## Step 5 — Create super-admin account

1. Go to Authentication → Users → Add user
2. Email: `nerrafael1@gmail.com` (or new admin email)
3. Password: **use a strong password — NOT Admin2024**
4. In SQL Editor, run:

```sql
UPDATE profiles
  SET role = 'super_admin', full_name = 'Ner Velasquez'
  WHERE email = 'nerrafael1@gmail.com';

INSERT INTO user_modules (user_id, module_id)
  SELECT p.id, m.id FROM profiles p, modules m
  WHERE p.email = 'nerrafael1@gmail.com'
  ON CONFLICT (user_id, module_id) DO UPDATE SET active = true;
```

---

## Step 6 — Copy module HTML files

Copy the 3 dashboard HTML files into their module folders:

```
allstate-academy.html    → modules/allstate/allstate-academy.html
american-amicable.html   → modules/american-amicable/american-amicable.html
cica-citizens-v2.html    → modules/cica/cica-citizens-v2.html
```

---

## Step 7 — Apply migration patches to each HTML file

For each module HTML file, add 3 lines just before `</body>`:

### allstate-academy.html
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="../../shared/supabase-config.js"></script>
<script src="allstate-patch.js"></script>
```

### american-amicable.html
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="../../shared/supabase-config.js"></script>
<script src="aa-patch.js"></script>
```

### cica-citizens-v2.html
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="../../shared/supabase-config.js"></script>
<script src="cica-patch.js"></script>
```

In VS Code: Ctrl+F → search `</body>` → paste the 3 lines above it.

---

## Step 8 — Deploy to Vercel

### Option A: Vercel CLI
```bash
npm i -g vercel
cd academia-ensurity
vercel --prod
```

### Option B: Vercel Dashboard
1. Push `academia-ensurity/` folder to a GitHub repo
2. Go to vercel.com → New Project → Import repo
3. Set environment variables:
   - `SUPABASE_URL` = your project URL
   - `SUPABASE_ANON_KEY` = your anon key
4. Deploy

### Option C: Netlify (alternative)
```bash
npm i -g netlify-cli
netlify deploy --dir . --prod
```

---

## Step 9 — Grant module access to agents

When an agent registers via the platform:
1. They appear in the Admin Panel → All Users
2. Go to Module Access → Grant Access
3. Enter their email + select their modules → Grant

OR via SQL:
```sql
INSERT INTO user_modules (user_id, module_id)
  SELECT p.id, 'allstate'  -- or 'american-amicable' or 'cica'
  FROM profiles p
  WHERE p.email = 'agent@example.com'
  ON CONFLICT DO UPDATE SET active = true;
```

---

## Security notes

| Risk (old) | Fix (new) |
|---|---|
| Passwords in localStorage plain text | Supabase Auth — bcrypt hashed, never in browser |
| Admin by CSS class (hackable in DevTools) | Role from Supabase DB with Row Level Security |
| Hardcoded `Admin2024` in client code | Admin created in Supabase — no code credentials |
| No auth on 3 separate apps | Single sign-on via `academia-ensurity.html` |
| Anyone can register and access all content | Module access granted per-user by admin |

---

## File size note

The HTML files are 40-117MB because PDFs are embedded as base64 strings.
**To reduce to ~50KB each**, extract PDFs to Supabase Storage:
1. Supabase Dashboard → Storage → New bucket: `module-docs` (public)
2. Upload each PDF
3. Replace base64 `<a download>` links with Supabase storage URLs
4. Update `trackDownload()` calls to pass the storage path

This is optional — the platform works fine with the large files too.
