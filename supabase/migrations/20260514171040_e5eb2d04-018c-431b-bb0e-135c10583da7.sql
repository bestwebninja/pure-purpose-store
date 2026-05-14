CREATE TABLE public.petri_scorecards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id uuid NOT NULL UNIQUE REFERENCES public.petri_tokens(id) ON DELETE CASCADE,
  case_id uuid,
  urgency numeric NOT NULL DEFAULT 0,
  stability numeric NOT NULL DEFAULT 0,
  delivery_confidence numeric NOT NULL DEFAULT 0,
  sponsor_alignment numeric NOT NULL DEFAULT 0,
  economic_impact numeric NOT NULL DEFAULT 0,
  composite_score numeric NOT NULL DEFAULT 0,
  autonomy_decision text NOT NULL DEFAULT 'manual',
  inputs jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_computed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.petri_scorecards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage petri scorecards"
  ON public.petri_scorecards
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_petri_scorecards_updated_at
  BEFORE UPDATE ON public.petri_scorecards
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_petri_scorecards_composite_desc
  ON public.petri_scorecards (composite_score DESC);

CREATE INDEX idx_petri_scorecards_case_id
  ON public.petri_scorecards (case_id);
