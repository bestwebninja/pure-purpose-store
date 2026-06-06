
-- Corporate sponsors intake table
CREATE TABLE IF NOT EXISTS public.corporate_sponsors (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name text NOT NULL,
  industry text NOT NULL DEFAULT '',
  website text NOT NULL DEFAULT '',
  poc_name text NOT NULL,
  poc_email text NOT NULL,
  poc_phone text NOT NULL DEFAULT '',
  poc_department text NOT NULL DEFAULT '',
  poc_role text NOT NULL DEFAULT '',
  address_line1 text NOT NULL DEFAULT '',
  address_line2 text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  state text NOT NULL DEFAULT '',
  zip text NOT NULL DEFAULT '',
  country text NOT NULL DEFAULT '',
  company_size text NOT NULL DEFAULT '',
  contribution_type text NOT NULL DEFAULT '',
  contribution_frequency text NOT NULL DEFAULT '',
  sponsorship_interest text NOT NULL DEFAULT '',
  branding_interest text NOT NULL DEFAULT '',
  budget_range text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'PENDING',
  submitted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.corporate_sponsors TO authenticated;
GRANT INSERT ON public.corporate_sponsors TO anon;
GRANT ALL ON public.corporate_sponsors TO service_role;

ALTER TABLE public.corporate_sponsors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit corporate application"
  ON public.corporate_sponsors FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Admins read corporate sponsors"
  ON public.corporate_sponsors FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update corporate sponsors"
  ON public.corporate_sponsors FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete corporate sponsors"
  ON public.corporate_sponsors FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_corporate_sponsors_updated_at
  BEFORE UPDATE ON public.corporate_sponsors
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Allow petri_matches to be rejected
ALTER TABLE public.petri_matches DROP CONSTRAINT IF EXISTS petri_matches_status_check;
ALTER TABLE public.petri_matches
  ADD CONSTRAINT petri_matches_status_check
  CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'executed'::text, 'confirmed'::text, 'rejected'::text]));
