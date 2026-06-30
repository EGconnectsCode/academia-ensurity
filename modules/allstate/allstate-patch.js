/**
 * allstate-patch.js — Supabase migration patch for allstate-academy.html
 *
 * HOW TO APPLY:
 *   Add these 3 lines just before </body> in allstate-academy.html:
 *
 *   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
 *   <script src="../../shared/supabase-config.js"></script>
 *   <script src="../../modules/allstate/allstate-patch.js"></script>
 *
 * WHAT THIS DOES:
 *   - Replaces localStorage auth (getUsers/saveUsers) with Supabase Auth
 *   - Replaces localStorage progress (ahs_st_*) with Supabase progress table
 *   - Replaces localStorage activity (ahs_act_*) with Supabase activity table
 *   - Removes hardcoded admin credentials from client-side code
 *   - Adds module access check on sign-in
 */

(function () {
  'use strict';

  const MODULE_ID = 'allstate';
  const PREFIX    = 'ahs';

  // Hide login screen immediately — auth is handled by the main login page
  (function hideLoginEarly() {
    const style = document.createElement('style');
    style.textContent = '#login-screen, #auth-screen { display: none !important; }';
    document.head.appendChild(style);
  })();

  // ── Local cache: synchronous bridge for async Supabase ──
  // The original dashboard code is synchronous. We pre-load Supabase data
  // into this cache so original code can read synchronously, while writes
  // go both to cache AND to Supabase asynchronously.
  const CACHE = {
    users:    [],
    stByEmail: {},   // email -> ST object
    actByEmail: {},  // email -> activity object
    quizProg:  {},   // modId -> progress
  };

  // ── Wait until AZ (supabase-config.js) is ready ──
  function whenReady(fn) {
    if (window.AZ && window.AZ.Auth) { fn(); return; }
    const t = setInterval(() => { if (window.AZ && window.AZ.Auth) { clearInterval(t); fn(); } }, 50);
  }

  // ════════════════════════════════════════════════
  //  1. OVERRIDE STORAGE FUNCTIONS
  // ════════════════════════════════════════════════

  // Returns user list (synchronous from cache)
  window.getUsers = function () { return CACHE.users.slice(); };

  // Save user list — async write to Supabase profiles
  window.saveUsers = function (users) {
    CACHE.users = users;
    // Async: upsert any NEW users (registrations) to Supabase
    users.forEach(async (u) => {
      try {
        // Only try to update if user exists in Supabase (sign-up handles creation)
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

  // Load user state (progress) — synchronous from cache
  window.loadUserST = function (email) {
    return CACHE.stByEmail[email.toLowerCase()] || null;
  };

  // Load user data — same as loadUserST for compatibility
  window.loadUserData = function (email) {
    const cached = CACHE.stByEmail[email.toLowerCase()];
    if (cached) {
      // Apply cached state into global ST
      if (window.ST) {
        window.ST.xp       = cached.xp || 0;
        window.ST.mods     = cached.mods || {};
        window.ST.docs     = cached.docs || [];
        window.ST.vids     = cached.vids || [];
      }
    }
  };

  // Save user state — async write to Supabase progress
  const _origSave = window.save;
  window.save = async function () {
    // Still write to localStorage as fallback
    try { _origSave && _origSave(); } catch (_) {}
    // Also sync to Supabase
    const session = await AZ.Auth.getSession();
    if (!session || !window.ST?.email) return;
    try {
      const userId = session.user.id;
      // Save overall ST (non-quiz data) as a special progress entry
      CACHE.stByEmail[window.ST.email.toLowerCase()] = { ...window.ST };
      // Sync XP to profile
      await AZ.db.from('profiles').update({
        xp:    window.ST.xp || 0,
        level: getLevel(window.ST.xp || 0),
      }).eq('id', userId);
    } catch (e) { console.warn('[AHS Patch] save error:', e.message); }
  };

  // Load quiz progress — synchronous from cache
  window.loadQuizProgress = function (modId) {
    return CACHE.quizProg[modId] || null;
  };

  // Save quiz progress — async write to Supabase
  window.saveQuizProgress = async function (modId, data) {
    CACHE.quizProg[modId] = data;
    // Also save to localStorage as fallback
    try { localStorage.setItem(`${PREFIX}_qprog_${modId}`, JSON.stringify(data)); } catch (_) {}
    const session = await AZ.Auth.getSession();
    if (!session) return;
    try {
      await AZ.Progress.saveAnswers(session.user.id, MODULE_ID, modId, data);
    } catch (e) { console.warn('[AHS Patch] saveQuizProgress error:', e.message); }
  };

  // Get activity — synchronous from cache
  window.getActivity = function (email) {
    return CACHE.actByEmail[email.toLowerCase()] || { sessions: [], quizzes: [], downloads: [], registered: null };
  };

  // Save activity — async write to Supabase activity table
  window.saveActivity = async function (email, act) {
    CACHE.actByEmail[email.toLowerCase()] = act;
    // Downloads are tracked separately; just log a generic event
    const session = await AZ.Auth.getSession();
    if (!session) return;
    try {
      // We don't replicate the full legacy structure; individual events are logged via AZ.Activity
    } catch (_) {}
  };

  // ════════════════════════════════════════════════
  //  2. OVERRIDE AUTH SIGN-IN
  // ════════════════════════════════════════════════
  const _origSignIn = window.doSignIn; // original function
  window.doSignIn = async function () {
    // Get email/pass from the form
    const emailEl = document.getElementById('si-email') || document.getElementById('auth-email') || document.querySelector('[id*="email"]');
    const passEl  = document.getElementById('si-pass')  || document.getElementById('auth-pass')  || document.querySelector('[id*="pass"]');

    // Try to get the actual input values from the original form
    // The allstate form uses 'si-email' and 'si-pass' IDs
    const formEmail = (document.getElementById('si-email') || { value: '' }).value.trim();
    const formPass  = (document.getElementById('si-pass')  || { value: '' }).value;

    if (!formEmail || !formPass) {
      // Fall back to original if we can't find the form fields
      if (_origSignIn) _origSignIn.call(this);
      return;
    }

    try {
      const { user, profile } = await AZ.Auth.signIn(formEmail, formPass);

      // Check module access
      const hasAccess = await AZ.Modules.hasAccess(profile.id, MODULE_ID);
      const isAdmin   = ['admin', 'super_admin'].includes(profile.role);
      if (!hasAccess && !isAdmin) {
        const msg = window.LANG === 'es'
          ? 'No tienes acceso a este módulo. Contacta a tu administrador.'
          : 'You do not have access to this module. Contact your administrator.';
        // Show error using the original dashboard's error display mechanism
        const errEl = document.getElementById('si-error') || document.getElementById('auth-error');
        if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; }
        else { alert(msg); }
        await AZ.Auth.signOut();
        return;
      }

      // Populate global ST with Supabase profile data
      window.ST = window.ST || {};
      window.ST.name  = profile.full_name || user.email;
      window.ST.email = user.email;
      window.ST.xp    = profile.xp || 0;

      // Load user's progress from Supabase into cache
      await _loadUserCache(profile.id, user.email);

      // Set admin class based on Supabase role
      if (isAdmin) {
        document.body.classList.add('is-admin');
      } else {
        document.body.classList.remove('is-admin');
      }

      // Launch the app using the original dashboard's launchApp()
      if (window.launchApp) window.launchApp();

      // Log activity
      await AZ.Activity.log(MODULE_ID, 'login');

    } catch (err) {
      const msg = err.message?.includes('Invalid login')
        ? (window.LANG === 'es' ? 'Correo o contraseña incorrectos.' : 'Incorrect email or password.')
        : err.message;
      const errEl = document.getElementById('si-error') || document.getElementById('auth-error');
      if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; }
      else { console.error('[AHS Patch] Sign-in error:', msg); }
    }
  };

  // ════════════════════════════════════════════════
  //  3. OVERRIDE SIGN OUT
  // ════════════════════════════════════════════════
  const _origSignOut = window.doSignOut || window.logout;
  window.doSignOut = async function () {
    await AZ.Activity.log(MODULE_ID, 'logout');
    await AZ.Auth.signOut();
    window.ST = { xp: 0, mods: {}, docs: [], vids: [], name: '', email: '' };
    // Call original to reset UI
    if (_origSignOut) _origSignOut.call(this);
    else location.reload();
  };

  // ════════════════════════════════════════════════
  //  4. OVERRIDE REGISTRATION
  // ════════════════════════════════════════════════
  const _origRegister = window.doRegister;
  window.doRegister = async function () {
    const nameEl  = document.getElementById('re-name')  || document.getElementById('reg-name');
    const emailEl = document.getElementById('re-email') || document.getElementById('reg-email');
    const passEl  = document.getElementById('re-pass')  || document.getElementById('reg-pass');
    if (!nameEl || !emailEl || !passEl) {
      if (_origRegister) _origRegister.call(this);
      return;
    }
    const name  = nameEl.value.trim();
    const email = emailEl.value.trim();
    const pass  = passEl.value;
    try {
      await AZ.Auth.signUp(email, pass, name);
      const successEl = document.getElementById('auth-success-msg') || document.getElementById('re-success');
      if (successEl) {
        successEl.textContent = window.LANG === 'es'
          ? '¡Cuenta creada! Revisa tu correo para confirmar.'
          : 'Account created! Check your email to confirm.';
        successEl.style.display = 'block';
      }
    } catch (err) {
      const errEl = document.getElementById('re-error') || document.getElementById('auth-error');
      const msg   = err.message?.includes('already registered')
        ? (window.LANG === 'es' ? 'Correo ya registrado.' : 'Email already registered.')
        : err.message;
      if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; }
    }
  };

  // ════════════════════════════════════════════════
  //  5. OVERRIDE PASSWORD RESET
  // ════════════════════════════════════════════════
  window.doForgot = async function () {
    const emailEl = document.getElementById('fp-email') || document.getElementById('forgot-email');
    if (!emailEl) return;
    try {
      await AZ.Auth.sendPasswordReset(emailEl.value.trim());
      const msgEl = document.getElementById('fp-msg') || document.getElementById('forgot-msg');
      if (msgEl) {
        msgEl.textContent = window.LANG === 'es' ? 'Enlace enviado. Revisa tu correo.' : 'Reset link sent. Check your email.';
        msgEl.style.display = 'block';
      }
    } catch (e) { console.error('[AHS Patch] Forgot error:', e.message); }
  };

  // ════════════════════════════════════════════════
  //  6. OVERRIDE DOWNLOAD TRACKING
  // ════════════════════════════════════════════════
  const _origTrackDownload = window.trackDownload;
  window.trackDownload = async function (fileName) {
    if (_origTrackDownload) _origTrackDownload.call(this, fileName);
    const session = await AZ.Auth.getSession();
    if (!session) return;
    await AZ.Downloads.record(session.user.id, MODULE_ID, fileName);
  };

  // ════════════════════════════════════════════════
  //  7. OVERRIDE QUIZ COMPLETION
  // ════════════════════════════════════════════════
  const _origFinishQuiz = window.qzFinish || window.finishQuiz;
  window.qzFinish = async function (mid, score, xpEarned) {
    if (_origFinishQuiz) _origFinishQuiz.call(this, mid, score, xpEarned);
    const session = await AZ.Auth.getSession();
    if (!session) return;
    try {
      await AZ.Progress.complete(session.user.id, MODULE_ID, mid, score, xpEarned || 0);
      await AZ.Activity.log(MODULE_ID, 'quiz_complete', { quiz: mid, score });
    } catch (e) { console.warn('[AHS Patch] qzFinish error:', e.message); }
  };

  // ════════════════════════════════════════════════
  //  8. SUPPRESS HARDCODED ADMIN SEED
  // ════════════════════════════════════════════════
  window.initAdminUser = function () { /* noop — admin managed in Supabase */ };

  // ════════════════════════════════════════════════
  //  9. LOAD CACHE FROM SUPABASE ON INIT
  // ════════════════════════════════════════════════
  async function _loadUserCache(userId, email) {
    try {
      // Load progress/state
      const progressMap = await AZ.Progress.load(userId, MODULE_ID);
      // Convert to the format the original dashboard expects
      const st = { xp: 0, mods: {}, docs: [], vids: [], name: window.ST?.name || '', email };
      Object.keys(progressMap).forEach(key => {
        const row = progressMap[key];
        if (row.completed) {
          st.mods[key] = { score: row.score, xp: row.xp_earned };
          st.xp += row.xp_earned || 0;
        }
      });
      CACHE.stByEmail[email.toLowerCase()] = st;
      if (window.ST) {
        window.ST.xp   = st.xp;
        window.ST.mods = st.mods;
      }
    } catch (e) { console.warn('[AHS Patch] loadUserCache error:', e.message); }
  }

  // ════════════════════════════════════════════════
  //  10. AUTO-LOGIN: Check for existing session on page load
  // ════════════════════════════════════════════════
  whenReady(async () => {
    try {
      const current = await AZ.Auth.getCurrentUser();
      if (!current) { window.location.replace('/'); return; }

      const { user, profile } = current;
      const hasAccess = await AZ.Modules.hasAccess(profile.id, MODULE_ID);
      const isAdmin   = ['admin', 'super_admin'].includes(profile.role);

      if (!hasAccess && !isAdmin) {
        await AZ.Auth.signOut();
        window.location.replace('/');
        return;
      }

      // Restore session into dashboard state
      window.ST = window.ST || {};
      window.ST.name  = profile.full_name || user.email;
      window.ST.email = user.email;
      window.ST.xp    = profile.xp || 0;

      await _loadUserCache(profile.id, user.email);

      if (isAdmin) document.body.classList.add('is-admin');
      else         document.body.classList.remove('is-admin');

      // Apply saved preferences
      if (profile.theme === 'dark' && window.toggleDark) {
        if (!document.body.classList.contains('dark')) window.toggleDark();
      }
      if (profile.lang && profile.lang !== 'en' && window.setLang) {
        window.setLang(profile.lang);
      }

      // Launch the app if auth screen is still showing
      const loginScreen = document.getElementById('login-screen') || document.getElementById('auth-screen');
      if (loginScreen && loginScreen.style.display !== 'none') {
        if (window.launchApp) window.launchApp();
      }
    } catch (e) { console.warn('[AHS Patch] auto-login error:', e.message); }
  });

  // ── Intercept dark/lang preference saves ──
  const _origSetDark = window.toggleDark;
  window.toggleDark = async function () {
    if (_origSetDark) _origSetDark.call(this);
    const session = await AZ.Auth.getSession();
    if (!session) return;
    const isDark = document.body.classList.contains('dark');
    await AZ.Prefs.save(session.user.id, { theme: isDark ? 'dark' : 'light' });
  };

  const _origSetLang = window.setLang || window.switchLang;
  if (window.setLang) {
    window.setLang = async function (lang) {
      if (_origSetLang) _origSetLang.call(this, lang);
      const session = await AZ.Auth.getSession();
      if (!session) return;
      await AZ.Prefs.save(session.user.id, { lang });
    };
  }

  console.log('[Academia Ensurity] Allstate patch loaded ✓');
})();
