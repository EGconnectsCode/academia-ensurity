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
const SUPABASE_ANON_KEY = window.ENV_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2YW1kb3B3YmpsY2NhemNob2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMTA4ODQsImV4cCI6MjA5Nzg4Njg4NH0.F2VmsQUyBDWXgX_kh8soWOv6W59wWaDRFMlmg6kzHY4';

// Module IDs — must match schema.sql modules.id
const MODULE_IDS = {
  ALLSTATE:           'allstate',
  AMERICAN_AMICABLE:  'american-amicable',
  CICA:               'cica',
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

  /** Get current user + profile (null if not logged in) */
  async getCurrentUser() {
    const session = await Auth.getSession();
    if (!session) return null;
    const profile = await Auth._getProfile(session.user.id);
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
    const { error } = await db.from('progress').upsert({
      user_id:      userId,
      module_id:    moduleId,
      quiz_key:     quizKey,
      score,
      xp_earned:   xpEarned,
      completed:    true,
      completed_at: new Date().toISOString(),
    }, { onConflict: 'user_id,module_id,quiz_key' });
    if (error) throw error;
    // Add XP to profile
    await db.rpc('increment_xp', { user_id: userId, amount: xpEarned });
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
  },

  async logPageView(moduleId, page) {
    return Activity.log(moduleId, 'page_view', { page });
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
      db.from('profiles').select('id,email,full_name,role,xp,level,created_at,course_interest').order('created_at', { ascending: false }),
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
window.AZ = { db, Auth, Modules, Progress, Downloads, Activity, Prefs, Admin, requireAuth, MODULE_IDS };
