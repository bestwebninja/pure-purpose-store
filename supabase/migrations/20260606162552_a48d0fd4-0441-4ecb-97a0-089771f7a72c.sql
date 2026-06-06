
ALTER TABLE public.sponsors            ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;
ALTER TABLE public.ngo_applications    ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;
ALTER TABLE public.campaigns           ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;
ALTER TABLE public.cases               ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;
ALTER TABLE public.petri_tokens        ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;
ALTER TABLE public.petri_matches       ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;
ALTER TABLE public.donations           ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;
ALTER TABLE public.fulfillment_events  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;
ALTER TABLE public.impact_reports      ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_sponsors_is_demo            ON public.sponsors(is_demo);
CREATE INDEX IF NOT EXISTS idx_ngo_applications_is_demo    ON public.ngo_applications(is_demo);
CREATE INDEX IF NOT EXISTS idx_campaigns_is_demo           ON public.campaigns(is_demo);
CREATE INDEX IF NOT EXISTS idx_cases_is_demo               ON public.cases(is_demo);
CREATE INDEX IF NOT EXISTS idx_petri_tokens_is_demo        ON public.petri_tokens(is_demo);
CREATE INDEX IF NOT EXISTS idx_petri_matches_is_demo       ON public.petri_matches(is_demo);
CREATE INDEX IF NOT EXISTS idx_donations_is_demo           ON public.donations(is_demo);
CREATE INDEX IF NOT EXISTS idx_fulfillment_events_is_demo  ON public.fulfillment_events(is_demo);
CREATE INDEX IF NOT EXISTS idx_impact_reports_is_demo      ON public.impact_reports(is_demo);
