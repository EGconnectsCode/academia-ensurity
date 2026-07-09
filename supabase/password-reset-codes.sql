-- Run this in the Supabase SQL editor
CREATE TABLE IF NOT EXISTS public.password_reset_codes (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  email      text        NOT NULL,
  code       text        NOT NULL,
  expires_at timestamptz NOT NULL,
  used       boolean     DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prc_email
  ON public.password_reset_codes (email);

ALTER TABLE public.password_reset_codes ENABLE ROW LEVEL SECURITY;
-- No public access — only service_role (Edge Function) can read/write
