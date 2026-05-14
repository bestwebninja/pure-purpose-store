
CREATE TABLE public.impact_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_user_id uuid NOT NULL,
  sponsor_id uuid,
  package_signature text NOT NULL,
  package_total numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending_review','approved','sent','failed')),
  summary text NOT NULL DEFAULT '',
  artifacts jsonb NOT NULL DEFAULT '{}'::jsonb,
  next_package jsonb,
  autonomy_level integer NOT NULL DEFAULT 0,
  approved_by uuid,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sponsor_user_id, package_signature)
);

CREATE INDEX idx_impact_reports_sponsor ON public.impact_reports(sponsor_user_id);
CREATE INDEX idx_impact_reports_status ON public.impact_reports(status);
CREATE INDEX idx_impact_reports_created ON public.impact_reports(created_at DESC);

ALTER TABLE public.impact_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage impact reports"
ON public.impact_reports
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Sponsors read own impact reports"
ON public.impact_reports
FOR SELECT
TO authenticated
USING (sponsor_user_id = auth.uid());

CREATE TRIGGER trg_impact_reports_updated_at
BEFORE UPDATE ON public.impact_reports
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
