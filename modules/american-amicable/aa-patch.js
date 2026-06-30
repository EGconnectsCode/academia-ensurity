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

  // Hide login screen immediately — auth is handled by the main login page
  (function hideLoginEarly() {
    const style = document.createElement('style');
    style.textContent = '#login-screen, #auth-screen { display: none !important; }';
    document.head.appendChild(style);
  })();

  const CACHE = {
    users:     [],
    stByEmail:  {},
    actByEmail: {},
  };

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
