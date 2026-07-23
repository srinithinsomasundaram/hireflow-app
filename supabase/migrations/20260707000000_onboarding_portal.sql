-- Onboarding sessions (one per hired candidate)
CREATE TABLE IF NOT EXISTS public.onboarding_sessions (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  token            text        UNIQUE NOT NULL,
  organization_id  uuid        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  application_id   uuid        REFERENCES public.applications(id) ON DELETE SET NULL,
  candidate_id     uuid        REFERENCES public.candidates(id) ON DELETE SET NULL,
  status           text        NOT NULL DEFAULT 'pending',  -- pending | in_progress | submitted | completed
  candidate_email  text        NOT NULL,
  candidate_name   text        NOT NULL,
  job_title        text,
  department       text,
  office_location  text,
  joining_date     date,
  hr_contact_name  text,
  hr_contact_email text,
  otp_code         text,
  otp_expires_at   timestamptz,
  verified         boolean     NOT NULL DEFAULT false,
  expires_at       timestamptz,
  submitted_at     timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- Section-by-section onboarding data
CREATE TABLE IF NOT EXISTS public.onboarding_data (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id  uuid        NOT NULL REFERENCES public.onboarding_sessions(id) ON DELETE CASCADE,
  section     text        NOT NULL,
  data        jsonb       NOT NULL DEFAULT '{}',
  completed   boolean     NOT NULL DEFAULT false,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(session_id, section)
);

CREATE INDEX IF NOT EXISTS onboarding_sessions_token_idx ON public.onboarding_sessions(token);
CREATE INDEX IF NOT EXISTS onboarding_sessions_org_idx   ON public.onboarding_sessions(organization_id);
CREATE INDEX IF NOT EXISTS onboarding_data_session_idx   ON public.onboarding_data(session_id);

ALTER TABLE public.onboarding_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_data     ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='onboarding_sessions' AND policyname='org members manage sessions'
  ) THEN
    CREATE POLICY "org members manage sessions"
      ON public.onboarding_sessions FOR ALL TO authenticated
      USING  (public.is_org_member(auth.uid(), organization_id))
      WITH CHECK (public.is_org_member(auth.uid(), organization_id));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='onboarding_data' AND policyname='org members read session data'
  ) THEN
    CREATE POLICY "org members read session data"
      ON public.onboarding_data FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.onboarding_sessions s
          WHERE s.id = session_id
          AND public.is_org_member(auth.uid(), s.organization_id)
        )
      );
  END IF;
END $$;

-- Storage bucket for uploaded onboarding documents
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='storage' AND table_name='buckets'
  ) THEN RETURN; END IF;

  INSERT INTO storage.buckets (id, name, public, file_size_limit)
  VALUES ('onboarding-docs', 'onboarding-docs', false, 10485760)
  ON CONFLICT (id) DO NOTHING;
END $$;
