-- Allow HR to configure which documents candidates must upload per session.
ALTER TABLE onboarding_sessions
  ADD COLUMN IF NOT EXISTS documents_config jsonb DEFAULT '[]'::jsonb;
