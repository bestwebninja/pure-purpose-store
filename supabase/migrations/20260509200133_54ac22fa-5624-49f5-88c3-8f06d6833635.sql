
CREATE TABLE IF NOT EXISTS public.petri_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('intent','match','output')),
  source_id uuid,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  score integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'none',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.petri_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read petri tokens" ON public.petri_tokens
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage petri tokens" ON public.petri_tokens
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE IF NOT EXISTS public.petri_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  help_request_id uuid,
  sponsor_id uuid,
  score integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','executed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.petri_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read petri matches" ON public.petri_matches
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage petri matches" ON public.petri_matches
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_petri_tokens_type ON public.petri_tokens(type);
CREATE INDEX IF NOT EXISTS idx_petri_tokens_source ON public.petri_tokens(source_id);
CREATE INDEX IF NOT EXISTS idx_petri_matches_help ON public.petri_matches(help_request_id);
CREATE INDEX IF NOT EXISTS idx_petri_matches_sponsor ON public.petri_matches(sponsor_id);
