-- Expose form_config publicly via a security-definer function.
-- form_config only contains field visibility settings (label/visible/required),
-- not sensitive data, so public read is safe.
-- This removes the need for the service role key on the public careers page.
CREATE OR REPLACE FUNCTION public.get_org_form_config(org_id uuid)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT form_config FROM public.organization_settings WHERE organization_id = org_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_org_form_config(uuid) TO anon, authenticated;
