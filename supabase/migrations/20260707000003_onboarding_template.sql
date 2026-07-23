-- Global onboarding template stored per organisation.
-- New sessions inherit documents_config and agreements_config from this template.
ALTER TABLE public.organization_settings
  ADD COLUMN IF NOT EXISTS onboarding_template jsonb DEFAULT '{}'::jsonb;
