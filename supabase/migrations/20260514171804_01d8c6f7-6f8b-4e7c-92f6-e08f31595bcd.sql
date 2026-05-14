
CREATE TABLE public.sponsor_funding_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id uuid NOT NULL UNIQUE,
  esg_goals text[] NOT NULL DEFAULT '{}',
  industries text[] NOT NULL DEFAULT '{}',
  geographies text[] NOT NULL DEFAULT '{}',
  brand_values text[] NOT NULL DEFAULT '{}',
  monthly_budget numeric NOT NULL DEFAULT 0 CHECK (monthly_budget >= 0),
  currency text NOT NULL DEFAULT 'USD',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sponsor_funding_profiles_sponsor ON public.sponsor_funding_profiles(sponsor_id);

ALTER TABLE public.sponsor_funding_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage sponsor funding profiles"
ON public.sponsor_funding_profiles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Sponsors read own funding profile"
ON public.sponsor_funding_profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.sponsors s
    WHERE s.id = sponsor_funding_profiles.sponsor_id
      AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Sponsors insert own funding profile"
ON public.sponsor_funding_profiles
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.sponsors s
    WHERE s.id = sponsor_funding_profiles.sponsor_id
      AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Sponsors update own funding profile"
ON public.sponsor_funding_profiles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.sponsors s
    WHERE s.id = sponsor_funding_profiles.sponsor_id
      AND s.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.sponsors s
    WHERE s.id = sponsor_funding_profiles.sponsor_id
      AND s.user_id = auth.uid()
  )
);

CREATE TRIGGER trg_sponsor_funding_profiles_updated_at
BEFORE UPDATE ON public.sponsor_funding_profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
