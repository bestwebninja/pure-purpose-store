
ALTER TABLE public.petri_tokens
  ADD COLUMN IF NOT EXISTS confidence_score numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS feedback_score numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS match_generation text NOT NULL DEFAULT 'v1';

ALTER TABLE public.petri_matches
  ADD COLUMN IF NOT EXISTS confidence_score numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS match_generation text NOT NULL DEFAULT 'v1';

CREATE TABLE IF NOT EXISTS public.petri_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid REFERENCES public.petri_matches(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating IN (-1, 0, 1)),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.petri_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read petri feedback" ON public.petri_feedback
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage petri feedback" ON public.petri_feedback
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_petri_feedback_match ON public.petri_feedback(match_id);
