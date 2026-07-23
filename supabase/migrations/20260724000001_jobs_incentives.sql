ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS has_incentives boolean NOT NULL DEFAULT false;
