/**
 * aa-patch.js — Supabase migration patch for american-amicable.html
 *
 * HOW TO APPLY:
 *   Add these 3 lines just before </body> in american-amicable.html:
 *
 *   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
 *   <script src="../../shared/supabase-config.js"></script>
 *   <script src="../../modules/american-amicable/aa-patch.js"></script>
 *
 * WHAT THIS DOES:
 *   - Replaces localStorage auth (getUsers/saveUsers) with Supabase Auth
 *   - Replaces localStorage progress (aa_st_*) with Supabase progress table
 *   - Replaces localStorage activity (aa_act_*) with Supabase activity table
 *   - Removes hardcoded admin credentials from client-side code
 *   - Adds module access check on sign-in
 */

(function () {
  'use strict';

  const MODULE_ID = 'american-amicable';
  const PREFIX    = 'aa';

  // Hide login screen + inject modern design overrides
  (function injectDesign() {
    const style = document.createElement('style');
    style.textContent = `
      #login-screen, #auth-screen { display: none !important; }

      :root {
        --az-navy:#0F172A; --az-navy2:#1E293B; --az-blue:#2563EB; --az-cyan:#0891B2;
        --az-bg:#F1F5F9; --az-surface:#FFFFFF; --az-border:#E2E8F0;
        --az-text:#0F172A; --az-text2:#64748B; --az-radius:12px;
        --az-shadow:0 1px 3px rgba(0,0,0,.07),0 4px 12px rgba(0,0,0,.06);
      }
      body { background:var(--az-bg)!important; font-family:'Inter','Segoe UI',system-ui,sans-serif!important; }

      .topbar { background:var(--az-navy)!important; border-bottom:1px solid rgba(255,255,255,.07)!important; box-shadow:0 1px 8px rgba(0,0,0,.25)!important; height:54px!important; padding:0 16px!important; display:flex!important; align-items:center!important; gap:10px!important; }
      .tb-logo { font-weight:700!important; font-size:.9rem!important; color:#fff!important; }
      .tb-logo small { display:block!important; font-size:.65rem!important; color:rgba(255,255,255,.5)!important; text-transform:uppercase!important; letter-spacing:.06em!important; }
      .tb-greet { font-size:.88rem!important; color:rgba(255,255,255,.75)!important; }
      .tb-greet strong { color:#fff!important; }
      .tb-btn { background:rgba(255,255,255,.08)!important; border:1px solid rgba(255,255,255,.12)!important; color:rgba(255,255,255,.8)!important; border-radius:8px!important; padding:5px 10px!important; font-size:.78rem!important; font-weight:600!important; cursor:pointer!important; transition:background .15s!important; }
      .tb-btn:hover { background:rgba(255,255,255,.16)!important; }
      .tb-sep { display:none!important; }

      .sidebar { background:var(--az-navy)!important; border-right:1px solid rgba(255,255,255,.07)!important; width:220px!important; }
      .sb-logo { padding:18px 16px 14px!important; border-bottom:1px solid rgba(255,255,255,.08)!important; }
      .sb-section { font-size:.62rem!important; font-weight:700!important; text-transform:uppercase!important; letter-spacing:.1em!important; color:rgba(255,255,255,.3)!important; padding:14px 16px 5px!important; }
      .sb-item { display:flex!important; align-items:center!important; gap:9px!important; padding:9px 16px!important; width:100%!important; text-align:left!important; background:none!important; border:none!important; color:rgba(255,255,255,.65)!important; font-size:.83rem!important; font-weight:500!important; cursor:pointer!important; transition:background .13s,color .13s!important; }
      .sb-item:hover { background:rgba(255,255,255,.06)!important; color:#fff!important; }
      .sb-item.active { background:rgba(37,99,235,.3)!important; color:#fff!important; font-weight:600!important; }
      .sb-badge { background:#3B82F6!important; color:#fff!important; font-size:.62rem!important; font-weight:700!important; border-radius:99px!important; padding:1px 6px!important; margin-left:auto!important; }
      .sb-avatar { width:30px!important; height:30px!important; border-radius:50%!important; background:linear-gradient(135deg,#3B82F6,#0891B2)!important; display:flex!important; align-items:center!important; justify-content:center!important; font-weight:700!important; font-size:.72rem!important; color:#fff!important; flex-shrink:0!important; }
      .sb-name { font-size:.82rem!important; font-weight:600!important; color:#fff!important; }
      .sb-level { font-size:.7rem!important; color:rgba(255,255,255,.45)!important; }
      .sb-footer { padding:12px 14px!important; border-top:1px solid rgba(255,255,255,.08)!important; }
      .sb-user { display:flex!important; align-items:center!important; gap:9px!important; }

      .hero { background:linear-gradient(135deg,var(--az-navy) 0%,#1e3a5f 60%,var(--az-navy2) 100%)!important; border-radius:var(--az-radius)!important; padding:28px 24px!important; margin-bottom:20px!important; display:flex!important; align-items:center!important; justify-content:space-between!important; gap:20px!important; flex-wrap:wrap!important; box-shadow:0 4px 20px rgba(0,0,0,.18)!important; border:1px solid rgba(255,255,255,.06)!important; }
      .hero-eye { font-size:.72rem!important; font-weight:600!important; color:rgba(255,255,255,.5)!important; text-transform:uppercase!important; letter-spacing:.08em!important; margin-bottom:6px!important; }
      .hero-title { font-size:1.7rem!important; font-weight:800!important; color:#fff!important; letter-spacing:-.02em!important; margin-bottom:5px!important; }
      .hero-sub { font-size:.83rem!important; color:rgba(255,255,255,.6)!important; margin-bottom:16px!important; }
      .hero-btns { display:flex!important; gap:8px!important; flex-wrap:wrap!important; }
      .btn-w,.btn-g { padding:8px 16px!important; border-radius:8px!important; border:none!important; font-size:.8rem!important; font-weight:600!important; cursor:pointer!important; transition:opacity .15s!important; }
      .btn-w { background:#fff!important; color:var(--az-navy)!important; }
      .btn-g { background:rgba(255,255,255,.12)!important; color:#fff!important; border:1px solid rgba(255,255,255,.2)!important; }
      .hero-stats { display:flex!important; gap:4px!important; }
      .h-stat { background:rgba(255,255,255,.08)!important; border:1px solid rgba(255,255,255,.1)!important; border-radius:10px!important; padding:14px 20px!important; text-align:center!important; min-width:80px!important; }
      .h-stat-n { font-size:1.6rem!important; font-weight:800!important; color:#fff!important; line-height:1!important; }
      .h-stat-l { font-size:.65rem!important; font-weight:600!important; color:rgba(255,255,255,.5)!important; text-transform:uppercase!important; letter-spacing:.07em!important; margin-top:4px!important; }

      .card { background:var(--az-surface)!important; border:1px solid var(--az-border)!important; border-radius:var(--az-radius)!important; padding:16px!important; box-shadow:var(--az-shadow)!important; }
      .card-title,.ctitle { font-size:.75rem!important; font-weight:700!important; text-transform:uppercase!important; letter-spacing:.06em!important; color:var(--az-text2)!important; margin-bottom:12px!important; }
      .alert-row { display:flex!important; justify-content:space-between!important; align-items:center!important; padding:8px 0!important; border-bottom:1px solid var(--az-border)!important; font-size:.83rem!important; color:var(--az-text)!important; }
      .alert-row:last-child { border-bottom:none!important; }
      .badge-red { background:#FEE2E2!important; color:#DC2626!important; font-size:.7rem!important; font-weight:700!important; border-radius:99px!important; padding:2px 8px!important; }
      .badge-yellow { background:#FEF9C3!important; color:#92400E!important; font-size:.7rem!important; font-weight:700!important; border-radius:99px!important; padding:2px 8px!important; }
      .g2 { display:grid!important; grid-template-columns:1fr 1fr!important; gap:16px!important; }
      @media(max-width:700px){.g2{grid-template-columns:1fr!important;}}
      .content { padding:20px!important; background:var(--az-bg)!important; }
      .page { padding:0!important; }
      .admin-badge { background:#DBEAFE!important; color:#1D4ED8!important; font-size:.6rem!important; font-weight:700!important; border-radius:4px!important; padding:1px 5px!important; margin-left:4px!important; }
      .admin-only { display:none!important; }
      body.is-admin .admin-only { display:flex!important; }
      #dark-btn { display:none!important; }
      #lang-btn-en, #lang-btn-es { display:none!important; }
      .az-lang-select {
        background:rgba(255,255,255,.08)!important; border:1px solid rgba(255,255,255,.2)!important;
        color:#fff!important; border-radius:8px!important; padding:5px 28px 5px 10px!important;
        font-size:.78rem!important; font-weight:600!important; cursor:pointer!important;
        outline:none!important; appearance:none!important; -webkit-appearance:none!important;
        background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='white' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")!important;
        background-repeat:no-repeat!important; background-position:right 8px center!important; background-size:10px!important;
      }
      .az-lang-select option { background:#1e293b!important; color:#fff!important; }
    `;
    document.addEventListener('DOMContentLoaded', function() {
      const acts = document.querySelector('.tb-acts') || document.querySelector('.tb-actions');
      if (!acts) return;
      const sel = document.createElement('select');
      sel.className = 'az-lang-select';
      sel.innerHTML = '<option value="en">🌐 English</option><option value="es">🌐 Español</option>';
      sel.addEventListener('change', function() {
        if (window.setLang) window.setLang(this.value);
      });
      acts.insertBefore(sel, acts.firstChild);
    });
    document.head.appendChild(style);
  })();

  const CACHE = {
    users:     [],
    stByEmail:  {},
    actByEmail: {},
  };

  // ── PDF Preview Modal ──
  (function injectPdfPreview() {
    const s = document.createElement('style');
    s.textContent = `
      #az-pdf-modal { display:none; position:fixed; inset:0; z-index:10000; }
      #az-pdf-modal.active { display:flex; align-items:center; justify-content:center; }
      .az-pdf-backdrop { position:absolute; inset:0; background:rgba(0,0,0,.65); backdrop-filter:blur(3px); }
      .az-pdf-panel { position:relative; width:min(92vw,1100px); height:90vh; background:#fff; border-radius:14px; overflow:hidden; display:flex; flex-direction:column; box-shadow:0 25px 60px rgba(0,0,0,.35); }
      .az-pdf-header { display:flex; align-items:center; gap:12px; padding:12px 16px; background:#0F172A; color:#fff; flex-shrink:0; }
      .az-pdf-title { font-weight:600; font-size:.9rem; flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .az-pdf-dl { background:#2563EB; color:#fff !important; padding:6px 14px; border-radius:8px; font-size:.8rem; font-weight:600; text-decoration:none; white-space:nowrap; }
      .az-pdf-dl:hover { background:#1d4ed8; }
      .az-pdf-close { background:rgba(255,255,255,.1); border:1px solid rgba(255,255,255,.2); color:#fff; width:32px; height:32px; border-radius:50%; cursor:pointer; font-size:1rem; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
      .az-pdf-close:hover { background:rgba(255,255,255,.2); }
      .az-pdf-frame { flex:1; width:100%; border:none; }
    `;
    document.head.appendChild(s);

    const modal = document.createElement('div');
    modal.id = 'az-pdf-modal';
    modal.innerHTML = `
      <div class="az-pdf-backdrop" onclick="window.closePdfPreview()"></div>
      <div class="az-pdf-panel">
        <div class="az-pdf-header">
          <span class="az-pdf-title" id="az-pdf-title">Documento</span>
          <a class="az-pdf-dl" id="az-pdf-dl" target="_blank" download>&#8659; Descargar</a>
          <button class="az-pdf-close" onclick="window.closePdfPreview()">&#10005;</button>
        </div>
        <iframe class="az-pdf-frame" id="az-pdf-frame" src="" frameborder="0"></iframe>
      </div>
    `;
    document.body.appendChild(modal);

    window.showPdfPreview = function(url, title) {
      document.getElementById('az-pdf-title').textContent = title || 'Documento';
      document.getElementById('az-pdf-frame').src = url;
      document.getElementById('az-pdf-dl').href = url;
      document.getElementById('az-pdf-modal').classList.add('active');
      document.body.style.overflow = 'hidden';
    };

    window.closePdfPreview = function() {
      document.getElementById('az-pdf-modal').classList.remove('active');
      document.getElementById('az-pdf-frame').src = '';
      document.body.style.overflow = '';
    };

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') window.closePdfPreview();
    });

    const _orig = window.dlFromUrl;
    window.dlFromUrl = function(url, fname) {
      if (url && url.startsWith('https://')) {
        window.showPdfPreview(url, fname);
      } else if (_orig) {
        _orig(url, fname);
      }
    };
  })();

  function whenReady(fn) {
    if (window.AZ && window.AZ.Auth) { fn(); return; }
    const t = setInterval(() => { if (window.AZ && window.AZ.Auth) { clearInterval(t); fn(); } }, 50);
  }

  // ════════════════════════════════════════════════
  //  1. OVERRIDE STORAGE FUNCTIONS
  // ════════════════════════════════════════════════
  window.getUsers = function () { return CACHE.users.slice(); };

  window.saveUsers = function (users) {
    CACHE.users = users;
    users.forEach(async (u) => {
      try {
        const { data } = await AZ.db.from('profiles').select('id').eq('email', u.email).single();
        if (data) {
          await AZ.db.from('profiles').update({
            full_name: u.name,
            role: u.isAdmin ? 'admin' : 'agent',
          }).eq('email', u.email);
        }
      } catch (_) {}
    });
  };

  window.loadST = function (email) {
    return CACHE.stByEmail[email.toLowerCase()] || null;
  };

  window.saveST = async function (email, st) {
    CACHE.stByEmail[email.toLowerCase()] = st;
    const session = await AZ.Auth.getSession();
    if (!session) return;
    try {
      await AZ.db.from('profiles').update({
        xp:    st.xp || 0,
        level: getLevel ? getLevel(st.xp || 0) : 1,
      }).eq('id', session.user.id);
    } catch (e) { console.warn('[AA Patch] saveST error:', e.message); }
  };

  window.getActivity = function (email) {
    return CACHE.actByEmail[email.toLowerCase()] || { sessions: [], downloads: [] };
  };

  window.saveActivity = async function (email, act) {
    CACHE.actByEmail[email.toLowerCase()] = act;
    // Individual events are logged via AZ.Activity in the overridden functions below
  };

  // ════════════════════════════════════════════════
  //  2. OVERRIDE SIGN-IN
  // ════════════════════════════════════════════════
  window.doSignIn = async function () {
    clearField && clearField('li', 'email');
    clearField && clearField('li', 'pass');

    const emailEl = document.getElementById('li-email');
    const passEl  = document.getElementById('li-pass');
    if (!emailEl || !passEl) return;

    const email = emailEl.value.trim();
    const pass  = passEl.value;
    if (!email || !pass) return;

    try {
      const { user, profile } = await AZ.Auth.signIn(email, pass);

      const hasAccess = await AZ.Modules.hasAccess(profile.id, MODULE_ID);
      const isAdmin   = ['admin', 'super_admin'].includes(profile.role);

      if (!hasAccess && !isAdmin) {
        const msg = window.LANG === 'es'
          ? 'No tienes acceso a este módulo. Contacta a tu administrador.'
          : 'You do not have access to this module. Contact your administrator.';
        setFieldErr && setFieldErr('li', 'email', msg);
        await AZ.Auth.signOut();
        return;
      }

      // Populate ST
      window.ST = window.ST || { name: '', email: '', xp: 0, downloads: 0 };
      window.ST.name  = profile.full_name || user.email;
      window.ST.email = user.email;
      window.ST.xp    = profile.xp || 0;

      // Load progress into cache
      await _loadUserCache(profile.id, user.email);

      if (isAdmin) document.body.classList.add('is-admin');
      else         document.body.classList.remove('is-admin');

      // Launch app using original AA launchApp()
      if (window.launchApp) window.launchApp();

      await AZ.Activity.log(MODULE_ID, 'login');

    } catch (err) {
      const msg = err.message?.includes('Invalid login')
        ? (window.LANG === 'es' ? 'Correo o contrasena incorrectos' : 'Incorrect email or password')
        : err.message;
      setFieldErr && setFieldErr('li', 'email', msg);
    }
  };

  // ════════════════════════════════════════════════
  //  3. OVERRIDE SIGN OUT
  // ════════════════════════════════════════════════
  window.doSignOut = async function () {
    await AZ.Activity.log(MODULE_ID, 'logout');
    await AZ.Auth.signOut();
    window.ST = { name: '', email: '', xp: 0, downloads: 0 };
    location.reload();
  };

  // ════════════════════════════════════════════════
  //  4. OVERRIDE REGISTRATION
  // ════════════════════════════════════════════════
  window.doRegister = async function () {
    const nameEl  = document.getElementById('re-name');
    const emailEl = document.getElementById('re-email');
    const passEl  = document.getElementById('re-pass');
    if (!nameEl || !emailEl || !passEl) return;

    const name  = nameEl.value.trim();
    const email = emailEl.value.trim();
    const pass  = passEl.value;

    if (!name || !email || !pass) return;

    try {
      await AZ.Auth.signUp(email, pass, name);
      const sm = document.getElementById('auth-success-msg');
      if (sm) {
        sm.textContent = window.LANG === 'es'
          ? '¡Cuenta creada! Revisa tu correo para confirmar.'
          : 'Account created! Check your email to confirm.';
        sm.style.display = 'block';
      }
      switchTab && switchTab('login');
    } catch (err) {
      const msg = err.message?.includes('already registered')
        ? (window.LANG === 'es' ? 'Correo ya registrado' : 'Email already registered')
        : err.message;
      setFieldErr && setFieldErr('re', 'email', msg);
    }
  };

  // ════════════════════════════════════════════════
  //  5. OVERRIDE PASSWORD RESET
  // ════════════════════════════════════════════════
  window.doForgot = async function () {
    const emailEl = document.getElementById('fp-email');
    if (!emailEl) return;
    try {
      await AZ.Auth.sendPasswordReset(emailEl.value.trim());
      const msgEl = document.getElementById('fp-msg') || document.getElementById('forgot-msg');
      if (msgEl) {
        msgEl.textContent = window.LANG === 'es' ? 'Enlace enviado. Revisa tu correo.' : 'Reset link sent.';
        msgEl.style.display = 'block';
      }
    } catch (e) { console.error('[AA Patch] forgot error:', e.message); }
  };

  // ════════════════════════════════════════════════
  //  6. OVERRIDE DOWNLOAD TRACKING
  // ════════════════════════════════════════════════
  const _origTrack = window.trackDownload;
  window.trackDownload = async function (fileName) {
    if (_origTrack) _origTrack.call(this, fileName);
    const session = await AZ.Auth.getSession();
    if (!session) return;
    await AZ.Downloads.record(session.user.id, MODULE_ID, fileName);
    await AZ.Activity.log(MODULE_ID, 'download', { file: fileName });
  };

  // ════════════════════════════════════════════════
  //  7. SUPPRESS HARDCODED ADMIN SEED
  // ════════════════════════════════════════════════
  window.seedAdminUser = function () { /* noop — admin managed in Supabase */ };

  // ════════════════════════════════════════════════
  //  8. LOAD CACHE FROM SUPABASE
  // ════════════════════════════════════════════════
  async function _loadUserCache(userId, email) {
    try {
      const progressMap = await AZ.Progress.load(userId, MODULE_ID);
      const st = { xp: 0, downloads: 0 };
      Object.values(progressMap).forEach(row => { if (row.completed) st.xp += row.xp_earned || 0; });

      const downloadsData = await AZ.Downloads.getForUser(userId, MODULE_ID);
      st.downloads = downloadsData.length;

      CACHE.stByEmail[email.toLowerCase()] = st;
      if (window.ST) { window.ST.xp = st.xp; window.ST.downloads = st.downloads; }
    } catch (e) { console.warn('[AA Patch] loadUserCache error:', e.message); }
  }

  // ════════════════════════════════════════════════
  //  9. AUTO-LOGIN on page load
  // ════════════════════════════════════════════════
  whenReady(async () => {
    try {
      const current = await AZ.Auth.getCurrentUser();
      if (!current) { window.location.replace('/'); return; }

      const { user, profile } = current;
      const hasAccess = await AZ.Modules.hasAccess(profile.id, MODULE_ID);
      const isAdmin   = ['admin', 'super_admin'].includes(profile.role);
      if (!hasAccess && !isAdmin) { await AZ.Auth.signOut(); window.location.replace('/'); return; }

      window.ST = window.ST || { name: '', email: '', xp: 0, downloads: 0 };
      window.ST.name  = profile.full_name || user.email;
      window.ST.email = user.email;
      window.ST.xp    = profile.xp || 0;

      await _loadUserCache(profile.id, user.email);

      if (isAdmin) document.body.classList.add('is-admin');
      else         document.body.classList.remove('is-admin');

      // Apply preferences
      if (profile.theme === 'dark') {
        if (!window.DARK) { window.DARK = true; document.body.classList.add('dark'); }
      } else {
        if (window.DARK) { window.DARK = false; document.body.classList.remove('dark'); }
      }
      if (profile.lang && window.setLang) window.setLang(profile.lang);

      const loginScreen = document.getElementById('login-screen');
      if (loginScreen && loginScreen.style.display !== 'none') {
        if (window.launchApp) window.launchApp();
      }
    } catch (e) { console.warn('[AA Patch] auto-login error:', e.message); }
  });

  // ── Intercept dark/lang preference saves ──
  const _origToggleDark = window.toggleDark;
  window.toggleDark = async function () {
    if (_origToggleDark) _origToggleDark.call(this);
    const session = await AZ.Auth.getSession();
    if (!session) return;
    await AZ.Prefs.save(session.user.id, { theme: document.body.classList.contains('dark') ? 'dark' : 'light' });
  };

  const _origSetLang = window.setLang;
  window.setLang = async function (lang) {
    if (_origSetLang) _origSetLang.call(this, lang);
    const session = await AZ.Auth.getSession();
    if (!session) return;
    await AZ.Prefs.save(session.user.id, { lang });
  };

  console.log('[Academia Ensurity] American Amicable patch loaded ✓');
})();
