
ALTER TABLE public.petri_matches DROP CONSTRAINT IF EXISTS petri_matches_status_check;
ALTER TABLE public.petri_matches ADD CONSTRAINT petri_matches_status_check
  CHECK (status IN ('pending','approved','executed','confirmed'));
