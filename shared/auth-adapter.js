/**
 * auth-adapter.js — drop-in replacement for localStorage auth used in all 3 dashboards.
 *
 * USAGE: Include this file instead of (or after) each module's inline auth code.
 * The adapter exposes the same API that the original dashboards use internally,
 * but routes calls to Supabase instead of localStorage.
 *
 * Requires: supabase-config.js (loaded first)
 *
 * Each module passes its MODULE_ID and PREFIX when calling AZAdapter.init():
 *   AZAdapter.init('allstate', 'ahs');
 *   AZAdapter.init('american-amicable', 'aa');
 *   AZAdapter.init('cica', 'cica');
 */

const AZAdapter = (() => {
  let _moduleId  = null;
  let _prefix    = null;
  let _currentUser = null;   // { user, profile }
  let _onAuthChange = [];    // callbacks

  // -------------------------------------------------------------------------
  // PUBLIC: init — call once per module page load
  // -------------------------------------------------------------------------
  async function init(moduleId, prefix, onReady) {
    _moduleId = moduleId;
    _prefix   = prefix;

    // Subscribe to Supabase auth state changes
    AZ.db.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        try {
          _currentUser = await AZ.Auth.getCurrentUser();
        } catch (_) {
          _currentUser = null;
        }
      } else {
        _currentUser = null;
      }
      _onAuthChange.forEach(cb => cb(_currentUser, event));
    });

    // Restore existing session
    const session = await AZ.Auth.getSession();
    if (session) {
      _currentUser = await AZ.Auth.getCurrentUser();
    }

    if (onReady) onReady(_currentUser);
    return _currentUser;
  }

  // -------------------------------------------------------------------------
  // AUTH
  // -------------------------------------------------------------------------
  async function signIn(email, password) {
    const result = await AZ.Auth.signIn(email, password);
    _currentUser = result;

    // Check module access
    const hasAccess = await AZ.Modules.hasAccess(result.profile.id, _moduleId);
    const isAdmin   = ['admin', 'super_admin'].includes(result.profile.role);

    if (!hasAccess && !isAdmin) {
      await AZ.Auth.signOut();
      throw new Error('NO_MODULE_ACCESS');
    }

    // Apply saved preferences
    const prefs = await AZ.Prefs.load(result.profile.id);
    if (prefs.lang)  document.documentElement.setAttribute('data-lang', prefs.lang);
    if (prefs.theme) document.body.classList.toggle('dark', prefs.theme === 'dark');

    return result;
  }

  async function signUp(email, password, fullName, phone = '') {
    return AZ.Auth.signUp(email, password, fullName, phone);
  }

  async function signOut() {
    await AZ.Auth.signOut();
    _currentUser = null;
  }

  async function sendPasswordReset(email) {
    return AZ.Auth.sendPasswordReset(email);
  }

  function getCurrentUser() {
    return _currentUser;
  }

  function isLoggedIn() {
    return !!_currentUser;
  }

  function isAdmin() {
    return _currentUser && ['admin', 'super_admin'].includes(_currentUser.profile.role);
  }

  function onAuthChange(cb) {
    _onAuthChange.push(cb);
  }

  // -------------------------------------------------------------------------
  // PROGRESS  (replaces ahs_st_*, aa_st_*, cica_st_* localStorage keys)
  // -------------------------------------------------------------------------
  async function loadProgress() {
    if (!_currentUser) return {};
    return AZ.Progress.load(_currentUser.profile.id, _moduleId);
  }

  async function saveProgress(quizKey, answers) {
    if (!_currentUser) return;
    return AZ.Progress.saveAnswers(_currentUser.profile.id, _moduleId, quizKey, answers);
  }

  async function completeQuiz(quizKey, score, xpEarned) {
    if (!_currentUser) return;
    return AZ.Progress.complete(_currentUser.profile.id, _moduleId, quizKey, score, xpEarned);
  }

  // -------------------------------------------------------------------------
  // DOWNLOADS  (replaces inline download tracking in each dashboard)
  // -------------------------------------------------------------------------
  async function trackDownload(fileName, filePath = null) {
    if (!_currentUser) return;
    return AZ.Downloads.record(_currentUser.profile.id, _moduleId, fileName, filePath);
  }

  // -------------------------------------------------------------------------
  // PREFERENCES  (replaces ahs_dark, aa_dark, cica_dark, etc.)
  // -------------------------------------------------------------------------
  async function savePref(key, value) {
    if (!_currentUser) {
      // Fallback to localStorage while offline/unauthenticated
      localStorage.setItem(`${_prefix}_${key}`, value);
      return;
    }
    const prefs = {};
    if (key === 'dark')  prefs.theme = value ? 'dark' : 'light';
    if (key === 'lang')  prefs.lang  = value;
    if (Object.keys(prefs).length) {
      await AZ.Prefs.save(_currentUser.profile.id, prefs);
    }
  }

  function loadPref(key, defaultValue = null) {
    if (!_currentUser) return localStorage.getItem(`${_prefix}_${key}`) || defaultValue;
    if (key === 'dark')  return _currentUser.profile.theme === 'dark';
    if (key === 'lang')  return _currentUser.profile.lang || defaultValue;
    return defaultValue;
  }

  // -------------------------------------------------------------------------
  // ACTIVITY
  // -------------------------------------------------------------------------
  async function logPage(page) {
    return AZ.Activity.logPageView(_moduleId, page);
  }

  async function logEvent(eventType, data = {}) {
    return AZ.Activity.log(_moduleId, eventType, data);
  }

  // -------------------------------------------------------------------------
  // PROFILE HELPERS  (for displaying user info in the dashboard UI)
  // -------------------------------------------------------------------------
  function getDisplayName() {
    return _currentUser?.profile?.full_name || _currentUser?.user?.email || '';
  }

  function getEmail() {
    return _currentUser?.user?.email || '';
  }

  function getXP() {
    return _currentUser?.profile?.xp || 0;
  }

  function getLevel() {
    return _currentUser?.profile?.level || 1;
  }

  // -------------------------------------------------------------------------
  // ADMIN HELPERS  (used in admin panel pages)
  // -------------------------------------------------------------------------
  async function adminGetUsers() {
    if (!isAdmin()) throw new Error('Unauthorized');
    return AZ.Admin.getAllUsers();
  }

  async function adminGetActivity(limit = 100) {
    if (!isAdmin()) throw new Error('Unauthorized');
    return AZ.Admin.getActivityFeed(limit);
  }

  async function adminGetRanking() {
    if (!isAdmin()) throw new Error('Unauthorized');
    return AZ.Admin.getModuleRanking(_moduleId);
  }

  async function adminGrantAccess(userId) {
    if (!isAdmin()) throw new Error('Unauthorized');
    return AZ.Admin.grantModuleAccess(userId, _moduleId);
  }

  async function adminRevokeAccess(userId) {
    if (!isAdmin()) throw new Error('Unauthorized');
    return AZ.Modules.revokeAccess(userId, _moduleId);
  }

  async function adminSetRole(userId, role) {
    if (!isAdmin()) throw new Error('Unauthorized');
    return AZ.Admin.setUserRole(userId, role);
  }

  // -------------------------------------------------------------------------
  // ERROR MESSAGES  (bilingual, mirrors original dashboard patterns)
  // -------------------------------------------------------------------------
  const ERROR_MESSAGES = {
    'Invalid login credentials': {
      en: 'Incorrect email or password.',
      es: 'Email o contraseña incorrectos.',
    },
    'Email not confirmed': {
      en: 'Please confirm your email before logging in.',
      es: 'Confirma tu email antes de iniciar sesión.',
    },
    'NO_MODULE_ACCESS': {
      en: 'You do not have access to this module. Contact your administrator.',
      es: 'No tienes acceso a este módulo. Contacta a tu administrador.',
    },
    'User already registered': {
      en: 'An account with this email already exists.',
      es: 'Ya existe una cuenta con este email.',
    },
  };

  function getErrorMessage(error, lang = 'en') {
    const msg = error?.message || String(error);
    for (const [key, msgs] of Object.entries(ERROR_MESSAGES)) {
      if (msg.includes(key)) return msgs[lang] || msgs.en;
    }
    return msg;
  }

  // -------------------------------------------------------------------------
  // PUBLIC API
  // -------------------------------------------------------------------------
  return {
    init,
    // Auth
    signIn, signUp, signOut, sendPasswordReset,
    getCurrentUser, isLoggedIn, isAdmin, onAuthChange,
    // Progress
    loadProgress, saveProgress, completeQuiz,
    // Downloads
    trackDownload,
    // Preferences
    savePref, loadPref,
    // Activity
    logPage, logEvent,
    // Profile display
    getDisplayName, getEmail, getXP, getLevel,
    // Admin
    adminGetUsers, adminGetActivity, adminGetRanking,
    adminGrantAccess, adminRevokeAccess, adminSetRole,
    // Utils
    getErrorMessage,
  };
})();

window.AZAdapter = AZAdapter;
