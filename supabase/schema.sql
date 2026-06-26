-- ============================================================
-- Academia Ensurity — Supabase Schema
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. MODULES — the 3 insurance training modules
-- ============================================================
CREATE TABLE IF NOT EXISTS modules (
  id          TEXT PRIMARY KEY,          -- 'allstate' | 'american-amicable' | 'cica'
  name        TEXT NOT NULL,
  description TEXT,
  color       TEXT,                       -- brand hex color
  logo_url    TEXT,
  active      BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

INSERT INTO modules (id, name, description, color) VALUES
  ('allstate',           'Allstate Health Solutions',  'AHS agent training — individual, senior, life plans', '#0033A0'),
  ('american-amicable',  'American Amicable',          'AA agent training — life products and new business',  '#1A3C6E'),
  ('cica',               'CICA Citizens',              'CICA agent portal — policies, claims, marketing',     '#2E7D32')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. PROFILES — extends Supabase auth.users
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT UNIQUE NOT NULL,
  full_name    TEXT,
  phone        TEXT,
  npn          TEXT,                     -- National Producer Number
  role         TEXT NOT NULL DEFAULT 'agent' CHECK (role IN ('agent','admin','super_admin')),
  xp           INTEGER DEFAULT 0,
  level        INTEGER DEFAULT 1,
  lang         TEXT DEFAULT 'en' CHECK (lang IN ('en','es')),
  theme        TEXT DEFAULT 'light' CHECK (theme IN ('light','dark')),
  avatar_url   TEXT,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile on auth.users insert
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 3. USER_MODULES — which modules a user can access
-- ============================================================
CREATE TABLE IF NOT EXISTS user_modules (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  module_id    TEXT NOT NULL REFERENCES modules(id),
  granted_by   UUID REFERENCES profiles(id),   -- admin who granted access
  granted_at   TIMESTAMPTZ DEFAULT now(),
  expires_at   TIMESTAMPTZ,                     -- NULL = never expires
  active       BOOLEAN DEFAULT true,
  UNIQUE(user_id, module_id)
);

-- ============================================================
-- 4. PROGRESS — quiz/module completion tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS progress (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  module_id       TEXT NOT NULL REFERENCES modules(id),
  quiz_key        TEXT NOT NULL,               -- e.g. 'm1', 'm2', 'portal', 'product'
  score           INTEGER DEFAULT 0,           -- percentage 0-100
  xp_earned       INTEGER DEFAULT 0,
  attempts        INTEGER DEFAULT 0,
  last_answers    JSONB,                        -- saved answers for resume
  completed       BOOLEAN DEFAULT false,
  completed_at    TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, module_id, quiz_key)
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER progress_updated_at
  BEFORE UPDATE ON progress
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 5. DOWNLOADS — file download tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS downloads (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  module_id   TEXT NOT NULL REFERENCES modules(id),
  file_name   TEXT NOT NULL,
  file_path   TEXT,                            -- Supabase Storage path
  downloaded_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 6. ACTIVITY — general event log (page views, logins, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS activity (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  module_id   TEXT REFERENCES modules(id),
  event_type  TEXT NOT NULL,                   -- 'login','logout','page_view','download','quiz_complete'
  event_data  JSONB,                            -- { page, file, score, ... }
  ip_address  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 7. SESSIONS — login session tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS sessions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  module_id    TEXT REFERENCES modules(id),
  started_at   TIMESTAMPTZ DEFAULT now(),
  ended_at     TIMESTAMPTZ,
  duration_sec INTEGER,
  user_agent   TEXT
);

-- ============================================================
-- 8. ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_modules  ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress      ENABLE ROW LEVEL SECURITY;
ALTER TABLE downloads     ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity      ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions      ENABLE ROW LEVEL SECURITY;

-- Helper: is caller an admin?
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin','super_admin')
  );
$$;

-- profiles: users read/update own; admins read all
CREATE POLICY "profiles_own_select"   ON profiles FOR SELECT USING (id = auth.uid() OR is_admin());
CREATE POLICY "profiles_own_update"   ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "profiles_admin_update" ON profiles FOR UPDATE USING (is_admin());

-- user_modules: users read own; only admins write
CREATE POLICY "user_modules_own_select"  ON user_modules FOR SELECT USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "user_modules_admin_write" ON user_modules FOR ALL    USING (is_admin());

-- progress: users own data; admins read all
CREATE POLICY "progress_own"        ON progress FOR ALL    USING (user_id = auth.uid());
CREATE POLICY "progress_admin_read" ON progress FOR SELECT USING (is_admin());

-- downloads: users own; admins read all
CREATE POLICY "downloads_own"        ON downloads FOR ALL    USING (user_id = auth.uid());
CREATE POLICY "downloads_admin_read" ON downloads FOR SELECT USING (is_admin());

-- activity: users own; admins read all
CREATE POLICY "activity_own"        ON activity FOR ALL    USING (user_id = auth.uid());
CREATE POLICY "activity_admin_read" ON activity FOR SELECT USING (is_admin());

-- sessions: users own; admins read all
CREATE POLICY "sessions_own"        ON sessions FOR ALL    USING (user_id = auth.uid());
CREATE POLICY "sessions_admin_read" ON sessions FOR SELECT USING (is_admin());

-- modules: public read (no auth needed to see module list)
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "modules_public_read" ON modules FOR SELECT USING (true);

-- ============================================================
-- 9. USEFUL VIEWS (admin use)
-- ============================================================

CREATE OR REPLACE VIEW admin_user_summary AS
SELECT
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.xp,
  p.level,
  p.created_at,
  ARRAY_AGG(um.module_id) FILTER (WHERE um.active = true) AS active_modules,
  COUNT(DISTINCT d.id)    AS total_downloads,
  COUNT(DISTINCT pr.id)   AS quizzes_completed
FROM profiles p
LEFT JOIN user_modules um ON um.user_id = p.id
LEFT JOIN downloads d      ON d.user_id = p.id
LEFT JOIN progress pr      ON pr.user_id = p.id AND pr.completed = true
GROUP BY p.id, p.email, p.full_name, p.role, p.xp, p.level, p.created_at;

CREATE OR REPLACE VIEW admin_activity_feed AS
SELECT
  a.created_at,
  p.email,
  p.full_name,
  a.module_id,
  a.event_type,
  a.event_data
FROM activity a
JOIN profiles p ON p.id = a.user_id
ORDER BY a.created_at DESC;

-- ============================================================
-- 10. INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_user_modules_user   ON user_modules(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_user       ON progress(user_id, module_id);
CREATE INDEX IF NOT EXISTS idx_downloads_user      ON downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_user       ON activity(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_created    ON activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_user       ON sessions(user_id);
