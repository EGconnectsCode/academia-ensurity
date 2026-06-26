-- ============================================================
-- Academia Ensurity — Supabase DB Functions
-- Run AFTER schema.sql
-- ============================================================

-- Increment XP for a user (called after quiz completion)
CREATE OR REPLACE FUNCTION increment_xp(user_id UUID, amount INTEGER)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  new_xp    INTEGER;
  new_level INTEGER;
BEGIN
  UPDATE profiles
  SET xp = xp + amount
  WHERE id = user_id
  RETURNING xp INTO new_xp;

  -- Level thresholds: 1=0, 2=100, 3=250, 4=500, 5=900, 6=1400, 7=2000, 8=2700, 9=3500, 10=5000
  new_level := CASE
    WHEN new_xp >= 5000 THEN 10
    WHEN new_xp >= 3500 THEN 9
    WHEN new_xp >= 2700 THEN 8
    WHEN new_xp >= 2000 THEN 7
    WHEN new_xp >= 1400 THEN 6
    WHEN new_xp >= 900  THEN 5
    WHEN new_xp >= 500  THEN 4
    WHEN new_xp >= 250  THEN 3
    WHEN new_xp >= 100  THEN 2
    ELSE 1
  END;

  UPDATE profiles SET level = new_level WHERE id = user_id;
END;
$$;

-- Get leaderboard for a module (or global if module_id IS NULL)
CREATE OR REPLACE FUNCTION get_leaderboard(p_module_id TEXT DEFAULT NULL, p_limit INTEGER DEFAULT 20)
RETURNS TABLE(
  rank        BIGINT,
  user_id     UUID,
  email       TEXT,
  full_name   TEXT,
  xp          INTEGER,
  level       INTEGER,
  avatar_url  TEXT
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    ROW_NUMBER() OVER (ORDER BY p.xp DESC) AS rank,
    p.id, p.email, p.full_name, p.xp, p.level, p.avatar_url
  FROM profiles p
  WHERE p.role = 'agent'
    AND (
      p_module_id IS NULL
      OR EXISTS (
        SELECT 1 FROM user_modules um
        WHERE um.user_id = p.id AND um.module_id = p_module_id AND um.active = true
      )
    )
  ORDER BY p.xp DESC
  LIMIT p_limit;
$$;

-- Get user stats summary
CREATE OR REPLACE FUNCTION get_user_stats(p_user_id UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'xp',                p.xp,
    'level',             p.level,
    'quizzes_completed', (SELECT COUNT(*) FROM progress WHERE user_id = p_user_id AND completed = true),
    'total_downloads',   (SELECT COUNT(*) FROM downloads WHERE user_id = p_user_id),
    'modules_active',    (SELECT COUNT(*) FROM user_modules WHERE user_id = p_user_id AND active = true),
    'last_activity',     (SELECT MAX(created_at) FROM activity WHERE user_id = p_user_id)
  )
  INTO result
  FROM profiles p
  WHERE p.id = p_user_id;

  RETURN result;
END;
$$;
