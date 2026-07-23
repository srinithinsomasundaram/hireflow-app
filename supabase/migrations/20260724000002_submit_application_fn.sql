-- Public SECURITY DEFINER function for job application submission.
-- Runs as the function owner (bypasses RLS), so no anon INSERT policies needed
-- on candidates or applications beyond what the function itself validates.
CREATE OR REPLACE FUNCTION public.submit_job_application(
  p_organization_id  uuid,
  p_job_id           uuid,
  p_full_name        text,
  p_email            text,
  p_phone            text    DEFAULT NULL,
  p_linkedin_url     text    DEFAULT NULL,
  p_current_company  text    DEFAULT NULL,
  p_experience_years numeric DEFAULT NULL,
  p_expected_salary  numeric DEFAULT NULL,
  p_notice_period    text    DEFAULT NULL,
  p_resume_url       text    DEFAULT NULL,
  p_cover_letter     text    DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_candidate_id        uuid;
  v_application_id      uuid;
  v_existing_candidate  uuid;
  v_existing_app        uuid;
BEGIN
  -- Validate job is published and belongs to the org
  IF NOT EXISTS (
    SELECT 1 FROM public.jobs
    WHERE id = p_job_id
      AND organization_id = p_organization_id
      AND status = 'published'
  ) THEN
    RETURN jsonb_build_object('error', 'Job not found or not accepting applications.');
  END IF;

  -- Upsert candidate: reuse existing record for the same email + org
  SELECT id INTO v_existing_candidate
  FROM public.candidates
  WHERE organization_id = p_organization_id
    AND lower(email) = lower(p_email);

  IF v_existing_candidate IS NOT NULL THEN
    v_candidate_id := v_existing_candidate;
  ELSE
    INSERT INTO public.candidates (
      organization_id, full_name, email, phone, linkedin_url,
      current_company, experience_years, expected_salary, notice_period,
      resume_url, source
    ) VALUES (
      p_organization_id, p_full_name, p_email, p_phone, p_linkedin_url,
      p_current_company, p_experience_years, p_expected_salary, p_notice_period,
      p_resume_url, 'careers_site'
    )
    RETURNING id INTO v_candidate_id;
  END IF;

  -- Prevent duplicate application to the same job
  SELECT id INTO v_existing_app
  FROM public.applications
  WHERE job_id = p_job_id AND candidate_id = v_candidate_id;

  IF v_existing_app IS NOT NULL THEN
    RETURN jsonb_build_object('error', 'You have already applied for this position.');
  END IF;

  -- Insert application
  INSERT INTO public.applications (
    organization_id, job_id, candidate_id, cover_letter, source
  ) VALUES (
    p_organization_id, p_job_id, v_candidate_id, p_cover_letter, 'careers_site'
  )
  RETURNING id INTO v_application_id;

  RETURN jsonb_build_object(
    'application_id', v_application_id,
    'candidate_id',   v_candidate_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_job_application(
  uuid, uuid, text, text, text, text, text, numeric, numeric, text, text, text
) TO anon, authenticated;
