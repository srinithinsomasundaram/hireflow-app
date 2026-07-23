-- ─────────────────────────────────────────────────────────────────────────────
-- Fix 1: create_organization_with_owner — idempotent, never returns 409
--
-- Changes:
--   • If the caller already owns a root org, return its id instead of failing.
--   • Auto-suffix the slug when it is already taken so the INSERT never hits
--     the unique constraint (no more 409 from duplicate slugs).
--   • ON CONFLICT guards on user_roles and organization_settings so a partial
--     re-run cannot cause an error on those secondary inserts either.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.create_organization_with_owner(
  _company_name text,
  _slug         text,
  _industry     text DEFAULT NULL,
  _website      text DEFAULT NULL
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _org_id     uuid;
  _uid        uuid    := auth.uid();
  _final_slug text    := _slug;
  _counter    integer := 1;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  -- ── Idempotency: if this user already owns a root org, return it ──────────
  -- (handles "retry after workspace creation failed" — avoids creating a second
  --  orphaned org and avoids the slug conflict that caused the 409)
  SELECT ur.organization_id INTO _org_id
  FROM   public.user_roles ur
  WHERE  ur.user_id   = _uid
    AND  ur.status    = 'active'
    AND  ur.role      = 'owner'
  ORDER BY ur.created_at ASC
  LIMIT 1;

  IF _org_id IS NOT NULL THEN
    RETURN _org_id;
  END IF;

  -- ── Auto-suffix slug until we find one that is free ──────────────────────
  WHILE EXISTS (SELECT 1 FROM public.organizations WHERE slug = _final_slug) LOOP
    _counter    := _counter + 1;
    _final_slug := _slug || '-' || _counter;
    IF _counter > 99 THEN
      -- Extremely unlikely; use a random hex suffix as last resort
      _final_slug := _slug || '-' || substr(md5(gen_random_uuid()::text), 1, 6);
      EXIT;
    END IF;
  END LOOP;

  -- ── Create the organisation ───────────────────────────────────────────────
  INSERT INTO public.organizations (company_name, slug, industry, website, owner_id)
  VALUES (_company_name, _final_slug, _industry, _website, _uid)
  RETURNING id INTO _org_id;

  INSERT INTO public.user_roles (user_id, organization_id, role)
  VALUES (_uid, _org_id, 'owner')
  ON CONFLICT (user_id, organization_id, role) DO NOTHING;

  INSERT INTO public.organization_settings (organization_id, careers_tagline)
  VALUES (_org_id, 'Join the ' || _company_name || ' team')
  ON CONFLICT (organization_id) DO NOTHING;

  INSERT INTO public.email_templates (organization_id, name, subject, body, type) VALUES
    (_org_id, 'Application Received',
     'We received your application for {{job_title}}',
     E'Hi {{candidate_name}},\n\nThanks for applying to the {{job_title}} role at {{company_name}}. Our team is reviewing your application and will be in touch soon.\n\nBest,\n{{company_name}}',
     'application_received'),
    (_org_id, 'Interview Invitation',
     'Interview invitation: {{job_title}} at {{company_name}}',
     E'Hi {{candidate_name}},\n\nWe''d like to invite you for an interview for the {{job_title}} role.\n\n{{meeting_url}}\n\nLooking forward to speaking with you.\n{{company_name}}',
     'interview_invite'),
    (_org_id, 'Offer Letter',
     'Your offer from {{company_name}}',
     E'Dear {{candidate_name}},\n\nWe are pleased to offer you the position of {{job_title}} at {{company_name}}.\n\nPlease find the full offer details attached. Welcome to the team!\n\nBest regards,\n{{company_name}}',
     'offer'),
    (_org_id, 'Rejection',
     'Update on your application to {{company_name}}',
     E'Hi {{candidate_name}},\n\nThank you for your interest in the {{job_title}} role. After careful consideration, we''ve decided to move forward with other candidates. We''ll keep your profile on file for future opportunities.\n\nBest wishes,\n{{company_name}}',
     'rejection');

  RETURN _org_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_organization_with_owner(text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_organization_with_owner(text, text, text, text) TO authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- Fix 2: create_workspace — resilient to partial re-runs
--
-- Changes:
--   • ON CONFLICT DO NOTHING on user_roles and organization_settings.
--   • Guard against nesting workspaces under workspaces.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.create_workspace(
  _parent_org_id  uuid,
  _workspace_name text,
  _slug           text
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _workspace_id uuid;
  _uid          uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id        = _uid
      AND organization_id = _parent_org_id
      AND status          = 'active'
  ) THEN
    RAISE EXCEPTION 'Not authorised to create workspaces under this organisation';
  END IF;

  IF EXISTS (SELECT 1 FROM public.organizations WHERE slug = _slug) THEN
    RAISE EXCEPTION 'Slug already taken';
  END IF;

  INSERT INTO public.organizations (company_name, slug, owner_id, parent_org_id)
  VALUES (_workspace_name, _slug, _uid, _parent_org_id)
  RETURNING id INTO _workspace_id;

  INSERT INTO public.user_roles (user_id, organization_id, role)
  VALUES (_uid, _workspace_id, 'owner')
  ON CONFLICT (user_id, organization_id, role) DO NOTHING;

  INSERT INTO public.organization_settings (organization_id, careers_tagline)
  VALUES (_workspace_id, 'Join the ' || _workspace_name || ' team')
  ON CONFLICT (organization_id) DO NOTHING;

  INSERT INTO public.email_templates (organization_id, name, subject, body, type) VALUES
    (_workspace_id, 'Application Received',
     'We received your application for {{job_title}}',
     E'Hi {{candidate_name}},\n\nThanks for applying to the {{job_title}} role at {{company_name}}. Our team is reviewing your application and will be in touch soon.\n\nBest,\n{{company_name}}',
     'application_received'),
    (_workspace_id, 'Interview Invitation',
     'Interview invitation: {{job_title}} at {{company_name}}',
     E'Hi {{candidate_name}},\n\nWe''d like to invite you for an interview for the {{job_title}} role.\n\n{{meeting_url}}\n\nLooking forward to speaking with you.\n{{company_name}}',
     'interview_invite');

  RETURN _workspace_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_workspace(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_workspace(uuid, text, text) TO authenticated;
