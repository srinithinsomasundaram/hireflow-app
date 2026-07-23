-- Organisation → Workspace hierarchy
-- organisations (parent_org_id IS NULL) = the company
-- workspaces    (parent_org_id IS NOT NULL) = sub-brands / brands under the company

ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS parent_org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_organizations_parent ON public.organizations(parent_org_id);

-- ── create_workspace ────────────────────────────────────────────────────────
-- Creates a workspace (child org) under an existing organisation.
-- Inherits no data from the parent — workspace has its own name, slug, careers page.
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
    WHERE user_id = _uid AND organization_id = _parent_org_id AND status = 'active'
  ) THEN RAISE EXCEPTION 'Not authorised to create workspaces under this organisation'; END IF;

  IF EXISTS (SELECT 1 FROM public.organizations WHERE slug = _slug) THEN
    RAISE EXCEPTION 'Slug already taken';
  END IF;

  INSERT INTO public.organizations (company_name, slug, owner_id, parent_org_id)
  VALUES (_workspace_name, _slug, _uid, _parent_org_id)
  RETURNING id INTO _workspace_id;

  INSERT INTO public.user_roles (user_id, organization_id, role)
  VALUES (_uid, _workspace_id, 'owner');

  INSERT INTO public.organization_settings (organization_id, careers_tagline)
  VALUES (_workspace_id, 'Join the ' || _workspace_name || ' team');

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
