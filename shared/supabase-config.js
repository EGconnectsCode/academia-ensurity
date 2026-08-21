/**
 * supabase-config.js — shared Supabase client for Academia Ensurity
 * Include BEFORE any module script:
 *   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
 *   <script src="../../shared/supabase-config.js"></script>
 */

// ---------------------------------------------------------------------------
// 1. CONFIGURATION — replace with your Supabase project values
// ---------------------------------------------------------------------------
const SUPABASE_URL = window.ENV_SUPABASE_URL || 'https://qvamdopwbjlccazchoer.supabase.co';
const SUPABASE_ANON_KEY = window.ENV_SUPABASE_ANON_KEY || 'sb_publishable_elaYSTS4exO-z3cVTC41yA_RBv9j1GZ';

// Module IDs — must match schema.sql modules.id
const MODULE_IDS = {
  ALLSTATE:           'allstate',
  AMERICAN_AMICABLE:  'american-amicable',
  CICA:               'cica',
  COREBR:             'corebr',
  GTL:                'gtl',
  LIBERTY_BANKERS:    'liberty-bankers',
  MOO:                'moo',
};

// ---------------------------------------------------------------------------
// 2. SUPABASE CLIENT
// ---------------------------------------------------------------------------
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// ---------------------------------------------------------------------------
// 3. AUTH HELPERS
// ---------------------------------------------------------------------------
const Auth = {
  /**
   * Sign in with email + password.
   * Returns { user, profile } or throws.
   */
  async signIn(email, password) {
    const { data, error } = await db.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const profile = await Auth._getProfile(data.user.id);
    if (profile.status === 'pending') {
      await db.auth.signOut();
      throw new Error('PENDING_APPROVAL');
    }
    if (profile.status === 'suspended') {
      await db.auth.signOut();
      throw new Error('ACCOUNT_SUSPENDED');
    }
    await Activity.log(null, 'login');
    return { user: data.user, profile };
  },

  /**
   * Register new account.
   * Returns { user, profile } or throws.
   */
  async signUp(email, password, fullName, phone = '', courseInterest = '') {
    const { data, error } = await db.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;
    // Profile auto-created by DB trigger; update with extra fields
    if (data.user) {
      await db.from('profiles').update({ full_name: fullName, phone, course_interest: courseInterest }).eq('id', data.user.id);
    }
    // Supabase signUp() can return an already-authenticated session (e.g. when
    // email confirmation is off) — sign back out immediately so a brand-new,
    // not-yet-approved account never has live dashboard access.
    if (data.session) {
      await db.auth.signOut();
    }
    return { user: data.user };
  },

  /** Sign out current user */
  async signOut() {
    await Activity.log(null, 'logout');
    const { error } = await db.auth.signOut();
    if (error) throw error;
  },

  /** Get current session (null if not logged in) */
  async getSession() {
    const { data } = await db.auth.getSession();
    return data.session;
  },

  /**
   * Get current user + profile (null if not logged in).
   * Also treats pending/suspended accounts as logged-out — Supabase signUp()
   * can leave an authenticated session in the browser right after
   * registration, before an admin has approved anything, so this is the
   * single choke point (used by every page's initial session check and by
   * requireAuth()) that actually enforces the approval gate.
   */
  async getCurrentUser() {
    const session = await Auth.getSession();
    if (!session) return null;
    const profile = await Auth._getProfile(session.user.id);
    if (profile.status === 'pending' || profile.status === 'suspended') {
      await db.auth.signOut();
      return null;
    }
    return { user: session.user, profile };
  },

  /** Fetch profile row for a user ID */
  async _getProfile(userId) {
    const { data, error } = await db.from('profiles').select('*').eq('id', userId).single();
    if (error) throw error;
    return data;
  },

  /** Send password reset email */
  async sendPasswordReset(email) {
    const { error } = await db.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/reset-password.html`,
    });
    if (error) throw error;
  },

  /** Update password (call after user clicks reset link) */
  async updatePassword(newPassword) {
    const { error } = await db.auth.updateUser({ password: newPassword });
    if (error) throw error;
  },

  /** Is current user an admin? */
  async isAdmin() {
    const current = await Auth.getCurrentUser();
    return current && ['admin', 'super_admin'].includes(current.profile.role);
  },
};

// ---------------------------------------------------------------------------
// 4. MODULE ACCESS CONTROL
// ---------------------------------------------------------------------------
const Modules = {
  /**
   * Get modules the current user can access.
   * Returns array of module IDs.
   */
  async getUserModules(userId) {
    const { data, error } = await db
      .from('user_modules')
      .select('module_id, modules(name, color, logo_url)')
      .eq('user_id', userId)
      .eq('active', true);
    if (error) throw error;
    return data || [];
  },

  /**
   * Check if user has access to a specific module.
   */
  async hasAccess(userId, moduleId) {
    const { data } = await db
      .from('user_modules')
      .select('id')
      .eq('user_id', userId)
      .eq('module_id', moduleId)
      .eq('active', true)
      .single();
    return !!data;
  },

  /**
   * Grant module access to a user (admin only).
   */
  async grantAccess(userId, moduleId, grantedById = null) {
    const { error } = await db.from('user_modules').upsert({
      user_id:    userId,
      module_id:  moduleId,
      granted_by: grantedById,
      active:     true,
    }, { onConflict: 'user_id,module_id' });
    if (error) throw error;
  },

  /**
   * Revoke module access (admin only).
   */
  async revokeAccess(userId, moduleId) {
    const { error } = await db
      .from('user_modules')
      .update({ active: false })
      .eq('user_id', userId)
      .eq('module_id', moduleId);
    if (error) throw error;
  },
};

// ---------------------------------------------------------------------------
// 5. PROGRESS TRACKING
// ---------------------------------------------------------------------------
const Progress = {
  /**
   * Load quiz progress for current user in a module.
   * Returns map: { quizKey: { score, xp_earned, completed, last_answers, attempts } }
   */
  async load(userId, moduleId) {
    const { data, error } = await db
      .from('progress')
      .select('*')
      .eq('user_id', userId)
      .eq('module_id', moduleId);
    if (error) throw error;
    const map = {};
    (data || []).forEach(row => { map[row.quiz_key] = row; });
    return map;
  },

  /**
   * Save/update quiz answers (in-progress save).
   */
  async saveAnswers(userId, moduleId, quizKey, answers) {
    const { error } = await db.from('progress').upsert({
      user_id:      userId,
      module_id:    moduleId,
      quiz_key:     quizKey,
      last_answers: answers,
    }, { onConflict: 'user_id,module_id,quiz_key' });
    if (error) throw error;
  },

  /**
   * Record a completed quiz with score and XP.
   */
  async complete(userId, moduleId, quizKey, score, xpEarned) {
    // Check prior completion — prevents XP farming on re-submit
    const { data: existing } = await db
      .from('progress')
      .select('completed')
      .eq('user_id', userId)
      .eq('module_id', moduleId)
      .eq('quiz_key', quizKey)
      .single();
    const alreadyCompleted = existing?.completed === true;

    const { error } = await db.from('progress').upsert({
      user_id:      userId,
      module_id:    moduleId,
      quiz_key:     quizKey,
      score,
      xp_earned:    xpEarned,
      completed:    true,
      completed_at: new Date().toISOString(),
    }, { onConflict: 'user_id,module_id,quiz_key' });
    if (error) throw error;

    // Award XP only on first completion
    if (!alreadyCompleted && xpEarned > 0) {
      await db.rpc('increment_xp', { user_id: userId, amount: xpEarned });
    }

    // Log to activity feed (fire-and-forget)
    Activity.log(moduleId, 'quiz_complete', { quiz_key: quizKey, score, xp_earned: xpEarned })
      .catch(() => {});
  },
};

// ---------------------------------------------------------------------------
// 6. DOWNLOAD TRACKING
// ---------------------------------------------------------------------------
const Downloads = {
  async record(userId, moduleId, fileName, filePath = null) {
    const { error } = await db.from('downloads').insert({
      user_id:   userId,
      module_id: moduleId,
      file_name: fileName,
      file_path: filePath,
    });
    if (error) console.warn('Download tracking error:', error.message);
  },

  async getForUser(userId, moduleId = null) {
    let query = db.from('downloads').select('*').eq('user_id', userId).order('downloaded_at', { ascending: false });
    if (moduleId) query = query.eq('module_id', moduleId);
    const { data } = await query;
    return data || [];
  },
};

// ---------------------------------------------------------------------------
// 7. ACTIVITY LOGGING
// ---------------------------------------------------------------------------
const Activity = {
  async log(moduleId, eventType, eventData = {}) {
    const session = await Auth.getSession();
    if (!session) return;
    await db.from('activity').insert({
      user_id:    session.user.id,
      module_id:  moduleId,
      event_type: eventType,
      event_data: eventData,
    });
    // Every page fires exactly one 'login' event on load (main dashboard and
    // every module's auto-login) — piggyback session tracking on it instead
    // of requiring a separate call at every one of those call sites.
    if (eventType === 'login') Session.start(moduleId, session);
  },

  async logPageView(moduleId, page) {
    return Activity.log(moduleId, 'page_view', { page });
  },
};

// ---------------------------------------------------------------------------
// 7b. SESSION TRACKING — how long an agent stayed, for the admin panel
// ---------------------------------------------------------------------------
// There's no reliable "the user closed the tab" event, so this approximates
// session length with a periodic heartbeat (updates ended_at/duration_sec on
// the same row every 60s) plus one best-effort update when the tab is hidden
// or unloaded. A session with ended_at in the last ~2 minutes reads as
// "currently active" in the admin panel; otherwise its last heartbeat is
// treated as the real end time. Accuracy is within one heartbeat interval,
// which is fine for usage analytics — this isn't a billing timer.
const Session = {
  _id: null,
  _startedAt: null,
  _token: null,
  _timer: null,

  async start(moduleId, authSession) {
    if (Session._id) return; // one session row per page load
    authSession = authSession || await Auth.getSession();
    if (!authSession) return;
    try {
      const { data } = await db.from('sessions')
        .insert({ user_id: authSession.user.id, module_id: moduleId || null, user_agent: navigator.userAgent })
        .select('id').single();
      if (!data) return;
      Session._id = data.id;
      Session._startedAt = Date.now();
      Session._token = authSession.access_token;
      Session._timer = setInterval(Session._tick, 60000);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') Session._tick();
      });
      window.addEventListener('pagehide', Session._tick);
    } catch (e) { /* session tracking is best-effort, never block the page */ }
  },

  _tick() {
    if (!Session._id) return;
    const duration_sec = Math.round((Date.now() - Session._startedAt) / 1000);
    // Plain fetch (not the supabase-js client) so this can run with
    // keepalive:true — needed for the update to actually complete during
    // visibilitychange/pagehide, when the page may be torn down mid-request.
    fetch(`${SUPABASE_URL}/rest/v1/sessions?id=eq.${Session._id}`, {
      method: 'PATCH',
      keepalive: true,
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${Session._token}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ ended_at: new Date().toISOString(), duration_sec }),
    }).catch(() => {});
  },
};

// ---------------------------------------------------------------------------
// 8. PREFERENCES (lang, theme) — stored in profiles
// ---------------------------------------------------------------------------
const Prefs = {
  async save(userId, prefs) {
    const allowed = {};
    if (prefs.lang)  allowed.lang  = prefs.lang;
    if (prefs.theme) allowed.theme = prefs.theme;
    await db.from('profiles').update(allowed).eq('id', userId);
  },

  async load(userId) {
    const { data } = await db.from('profiles').select('lang, theme').eq('id', userId).single();
    return data || { lang: 'en', theme: 'light' };
  },
};

// ---------------------------------------------------------------------------
// 9. ADMIN HELPERS
// ---------------------------------------------------------------------------
const Admin = {
  async getAllUsers() {
    const [profilesRes, modulesRes, downloadsRes, progressRes] = await Promise.all([
      db.from('profiles').select('id,email,full_name,role,xp,level,created_at,course_interest,full_access,status,agent_source,licensed').order('created_at', { ascending: false }),
      db.from('user_modules').select('user_id,module_id,active').eq('active', true),
      db.from('downloads').select('user_id'),
      db.from('progress').select('user_id').eq('completed', true),
    ]);
    if (profilesRes.error) throw profilesRes.error;
    const profiles = profilesRes.data || [];
    const modulesByUser = {};
    (modulesRes.data || []).forEach(r => {
      if (!modulesByUser[r.user_id]) modulesByUser[r.user_id] = [];
      modulesByUser[r.user_id].push(r.module_id);
    });
    const downloadsByUser = {};
    (downloadsRes.data || []).forEach(r => { downloadsByUser[r.user_id] = (downloadsByUser[r.user_id] || 0) + 1; });
    const quizzesByUser = {};
    (progressRes.data || []).forEach(r => { quizzesByUser[r.user_id] = (quizzesByUser[r.user_id] || 0) + 1; });
    return profiles.map(p => ({
      ...p,
      active_modules:    modulesByUser[p.id] || [],
      total_downloads:   downloadsByUser[p.id] || 0,
      quizzes_completed: quizzesByUser[p.id] || 0,
    }));
  },

  async getActivityFeed(limit = 100) {
    const { data, error } = await db
      .from('activity')
      .select('created_at,module_id,event_type,event_data,profiles(email,full_name)')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data || []).map(r => ({
      ...r,
      email:     r.profiles?.email,
      full_name: r.profiles?.full_name,
    }));
  },

  async getSessions(limit = 200) {
    const { data, error } = await db
      .from('sessions')
      .select('id,user_id,module_id,started_at,ended_at,duration_sec,user_agent,profiles(email,full_name)')
      .order('started_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data || []).map(r => ({
      ...r,
      email:     r.profiles?.email,
      full_name: r.profiles?.full_name,
    }));
  },

  async getModuleRanking(moduleId) {
    const { data, error } = await db
      .from('profiles')
      .select('id, email, full_name, xp, level')
      .order('xp', { ascending: false })
      .limit(50);
    if (error) throw error;
    return data || [];
  },

  async setUserRole(userId, role) {
    const { error } = await db.from('profiles').update({ role }).eq('id', userId);
    if (error) throw error;
  },

  // Manual override for agents with no Bitrix presence (has_license can't find
  // them there) — lets an admin record their license status directly.
  // value: true | false | null (null clears the override, falling back to
  // the automatic Bitrix check).
  async setLicensed(userId, value) {
    const { error } = await db.from('profiles').update({ licensed: value }).eq('id', userId);
    if (error) throw error;
  },

  async grantModuleAccess(userId, moduleId) {
    const session = await Auth.getSession();
    return Modules.grantAccess(userId, moduleId, session?.user?.id);
  },
};

// ---------------------------------------------------------------------------
// 10. GUARD — call at top of each module page to enforce auth + access
// ---------------------------------------------------------------------------
async function requireAuth(moduleId, redirectTo = '/academia-ensurity.html') {
  const current = await Auth.getCurrentUser();
  if (!current) {
    location.href = redirectTo;
    return null;
  }
  if (moduleId) {
    const allowed = await Modules.hasAccess(current.profile.id, moduleId);
    if (!allowed && current.profile.role === 'agent') {
      // Show access denied and redirect
      alert('You do not have access to this module. Contact your administrator.');
      location.href = redirectTo;
      return null;
    }
  }
  return current;
}

// Expose on window for inline scripts in HTML modules
window.AZ = { db, Auth, Modules, Progress, Downloads, Activity, Session, Prefs, Admin, requireAuth, MODULE_IDS };
