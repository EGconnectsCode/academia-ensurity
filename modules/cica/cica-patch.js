/**
 * cica-patch.js — Supabase migration patch for cica-citizens-v2.html
 *
 * HOW TO APPLY:
 *   Add these 3 lines just before </body> in cica-citizens-v2.html:
 *
 *   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
 *   <script src="../../shared/supabase-config.js"></script>
 *   <script src="../../modules/cica/cica-patch.js"></script>
 *
 * WHAT THIS DOES:
 *   - Replaces localStorage auth (getUsers/saveUsers) with Supabase Auth
 *   - Replaces localStorage state (cica_st_*) with Supabase progress table
 *   - Replaces localStorage activity (cica_act_*) with Supabase activity table
 *   - Removes hardcoded admin credentials from client-side code
 *   - Adds module access check on sign-in
 *
 * NOTE: CICA uses CUR_USER (not ST) as the current user variable.
 *   Quiz modules: 'portal', 'product', 'eligibility'
 */

(function () {
  'use strict';

  const MODULE_ID = 'cica';
  const PREFIX    = 'cica';

  // Hide login screen immediately — auth is handled by the main login page
  (function hideLoginEarly() {
    const style = document.createElement('style');
    style.textContent = '#login-screen, #auth-screen, #auth-wrap { display: none !important; }';
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
      await AZ.db.from('profiles').update({ xp: st.xp || 0 }).eq('id', session.user.id);
    } catch (e) { console.warn('[CICA Patch] saveST error:', e.message); }
  };

  window.getActivity = function (email) {
    return CACHE.actByEmail[email.toLowerCase()] || { sessions: [], downloads: [] };
  };

  window.saveActivity = async function (email, act) {
    CACHE.actByEmail[email.toLowerCase()] = act;
    // Individual events logged via AZ.Activity in overridden functions
  };

  // ════════════════════════════════════════════════
  //  2. OVERRIDE SIGN-IN
  // ════════════════════════════════════════════════
  window.doSignIn = async function () {
    clearErr && clearErr('li-err-email');
    clearErr && clearErr('li-err-pass');

    const emailEl = document.getElementById('li-email');
    const passEl  = document.getElementById('li-pass');
    if (!emailEl || !passEl) return;

    const email = emailEl.value.trim().toLowerCase();
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
        showMsg && showMsg('li-err-email', msg);
        await AZ.Auth.signOut();
        return;
      }

      // Populate CUR_USER (CICA uses CUR_USER, not ST)
      window.CUR_USER = {
        name:    profile.full_name || user.email,
        email:   user.email,
        isAdmin: isAdmin,
      };

      // Load progress into cache
      await _loadUserCache(profile.id, user.email);

      // Set admin class
      if (isAdmin) document.body.classList.add('is-admin');
      else         document.body.classList.remove('is-admin');

      // Call CICA's loginUser to update UI (it uses CUR_USER which we just set)
      if (window.loginUser) window.loginUser(window.CUR_USER);

      await AZ.Activity.log(MODULE_ID, 'login');

    } catch (err) {
      const msg = err.message?.includes('Invalid login')
        ? (window.LANG === 'es' ? 'Correo o contraseña incorrectos.' : 'Incorrect email or password.')
        : err.message;
      showMsg && showMsg('li-err-email', msg);
    }
  };

  // ════════════════════════════════════════════════
  //  3. OVERRIDE SIGN OUT
  // ════════════════════════════════════════════════
  const _origLogout = window.logout;
  window.logout = async function () {
    await AZ.Activity.log(MODULE_ID, 'logout');
    await AZ.Auth.signOut();
    window.CUR_USER = null;
    if (_origLogout) _origLogout.call(this);
    else location.reload();
  };

  // ════════════════════════════════════════════════
  //  4. OVERRIDE REGISTRATION
  // ════════════════════════════════════════════════
  const _origRegister = window.doRegister;
  window.doRegister = async function () {
    const nameEl  = document.getElementById('re-name');
    const emailEl = document.getElementById('re-email');
    const passEl  = document.getElementById('re-pass');
    if (!nameEl || !emailEl || !passEl) { if (_origRegister) _origRegister.call(this); return; }

    const name  = nameEl.value.trim();
    const email = emailEl.value.trim().toLowerCase();
    const pass  = passEl.value;

    if (!name || !email || !pass) return;
    if (!isValidEmail(email)) { showMsg && showMsg('re-err-email', LANG === 'es' ? 'Correo inválido' : 'Invalid email'); return; }

    try {
      await AZ.Auth.signUp(email, pass, name);
      showMsg && showMsg('re-success', LANG === 'es'
        ? '¡Cuenta creada! Revisa tu correo para confirmar.'
        : 'Account created! Check your email to confirm.');
      switchTab && switchTab('login');
    } catch (err) {
      const msg = err.message?.includes('already registered')
        ? (LANG === 'es' ? 'Correo ya registrado' : 'Email already registered')
        : err.message;
      showMsg && showMsg('re-err-email', msg);
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
      showMsg && showMsg('fp-msg', LANG === 'es' ? 'Enlace enviado. Revisa tu correo.' : 'Reset link sent.');
    } catch (e) { console.error('[CICA Patch] forgot error:', e.message); }
  };

  // ════════════════════════════════════════════════
  //  6. OVERRIDE DOWNLOAD TRACKING
  // ════════════════════════════════════════════════
  window.trackDownload = async function (name) {
    // Update local state
    if (window.CUR_USER) {
      var st = loadST(window.CUR_USER.email) || { xp: 0, sessions: 0, downloads: 0 };
      st.downloads = (st.downloads || 0) + 1;
      st.xp = (st.xp || 0) + 10;
      CACHE.stByEmail[window.CUR_USER.email] = st;
      if (window.updateLevel) window.updateLevel(st.xp);
      if (window.updateDashStats) window.updateDashStats();
    }
    // Async Supabase write
    const session = await AZ.Auth.getSession();
    if (!session) return;
    await AZ.Downloads.record(session.user.id, MODULE_ID, name);
    await AZ.Activity.log(MODULE_ID, 'download', { file: name });
    await AZ.db.rpc('increment_xp', { user_id: session.user.id, amount: 10 });
  };

  // ════════════════════════════════════════════════
  //  7. OVERRIDE QUIZ COMPLETION (CICA has 3 quiz modules)
  // ════════════════════════════════════════════════
  const _origSubmitQuiz = window.submitQuiz || window.qzFinish;
  window.qzFinish = window.submitQuiz = async function (quizId, score) {
    if (_origSubmitQuiz) _origSubmitQuiz.call(this, quizId, score);
    const session = await AZ.Auth.getSession();
    if (!session) return;
    const xpEarned = Math.round((score / 100) * 50); // up to 50 XP per quiz
    try {
      await AZ.Progress.complete(session.user.id, MODULE_ID, quizId, score, xpEarned);
      await AZ.Activity.log(MODULE_ID, 'quiz_complete', { quiz: quizId, score });
    } catch (e) { console.warn('[CICA Patch] qzFinish error:', e.message); }
  };

  // ════════════════════════════════════════════════
  //  8. LOAD CACHE FROM SUPABASE
  // ════════════════════════════════════════════════
  async function _loadUserCache(userId, email) {
    try {
      const progressMap = await AZ.Progress.load(userId, MODULE_ID);
      const st = { xp: 0, sessions: 0, downloads: 0 };
      Object.values(progressMap).forEach(row => { if (row.completed) st.xp += row.xp_earned || 0; });

      const downloadsData = await AZ.Downloads.getForUser(userId, MODULE_ID);
      st.downloads = downloadsData.length;

      CACHE.stByEmail[email.toLowerCase()] = st;
    } catch (e) { console.warn('[CICA Patch] loadUserCache error:', e.message); }
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

      window.CUR_USER = {
        name:    profile.full_name || user.email,
        email:   user.email,
        isAdmin: isAdmin,
      };

      await _loadUserCache(profile.id, user.email);

      if (isAdmin) document.body.classList.add('is-admin');
      else         document.body.classList.remove('is-admin');

      // Apply preferences
      if (profile.theme === 'dark' && !document.body.classList.contains('dark')) {
        if (window.toggleDark) window.toggleDark();
        else document.body.classList.add('dark');
      }
      if (profile.lang && window.LANG !== profile.lang) {
        window.LANG = profile.lang;
        if (window.setLang) window.setLang(profile.lang);
      }

      // Auto-launch if login screen is still showing
      const loginScreen = document.getElementById('login-screen') || document.getElementById('auth-wrap');
      if (loginScreen && loginScreen.style.display !== 'none') {
        if (window.loginUser) window.loginUser(window.CUR_USER);
      }
    } catch (e) { console.warn('[CICA Patch] auto-login error:', e.message); }
  });

  // ── Intercept preference saves ──
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

  console.log('[Academia Ensurity] CICA patch loaded ✓');
})();
