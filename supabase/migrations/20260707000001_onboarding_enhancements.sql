-- Enhance onboarding_sessions: configurable agreements, custom form fields,
-- verification expiry tracking, and session rejection support.

ALTER TABLE onboarding_sessions
  ADD COLUMN IF NOT EXISTS agreements_config    jsonb       DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS custom_fields_config jsonb       DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS last_verified_at     timestamptz,
  ADD COLUMN IF NOT EXISTS rejected_at          timestamptz,
  ADD COLUMN IF NOT EXISTS rejection_reason     text;
