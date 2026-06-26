-- ============================================================
-- Academia Ensurity — Seed Data
-- Run AFTER schema.sql and functions.sql
-- Creates the super-admin account and verifies modules exist
-- ============================================================

-- 1. Verify modules are present (they're inserted in schema.sql)
SELECT id, name FROM modules;

-- 2. After creating the super-admin via Supabase Auth Dashboard or CLI,
--    update their role and grant all module access:
--
--    Step A: Create user in Supabase Dashboard > Authentication > Users
--            Email: nerrafael1@gmail.com
--            Password: (set a STRONG new password — NOT Admin2024)
--
--    Step B: Run this SQL replacing the UUID with the actual user ID:
--
-- UPDATE profiles
--   SET role = 'super_admin', full_name = 'Ner Velasquez'
--   WHERE email = 'nerrafael1@gmail.com';
--
-- INSERT INTO user_modules (user_id, module_id)
--   SELECT id, m.id FROM profiles, modules m
--   WHERE profiles.email = 'nerrafael1@gmail.com'
--   ON CONFLICT (user_id, module_id) DO UPDATE SET active = true;

-- 3. Grant module access to an agent (run for each agent who signed up):
--
-- INSERT INTO user_modules (user_id, module_id)
--   SELECT p.id, 'allstate'
--   FROM profiles p
--   WHERE p.email = 'agent@example.com'
--   ON CONFLICT (user_id, module_id) DO UPDATE SET active = true;
