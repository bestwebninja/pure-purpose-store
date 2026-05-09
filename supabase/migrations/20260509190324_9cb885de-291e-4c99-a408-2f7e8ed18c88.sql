-- Extend role enum with sponsor + recipient (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'sponsor' AND enumtypid = 'public.app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'sponsor';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'recipient' AND enumtypid = 'public.app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'recipient';
  END IF;
END $$;

-- ============================================================
-- assistance_categories (recursive)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.assistance_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES public.assistance_categories(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  icon text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_assistance_categories_parent ON public.assistance_categories(parent_id);

ALTER TABLE public.assistance_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Assistance categories are publicly readable"
  ON public.assistance_categories FOR SELECT USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage assistance categories"
  ON public.assistance_categories FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_assistance_categories_updated
  BEFORE UPDATE ON public.assistance_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- providers
-- ============================================================
CREATE TABLE IF NOT EXISTS public.providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  logo_url text,
  website text,
  country text,
  verification_status text NOT NULL DEFAULT 'PENDING',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_providers_owner ON public.providers(owner_user_id);

ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active providers publicly readable"
  ON public.providers FOR SELECT USING (is_active = true OR owner_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage providers"
  ON public.providers FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Owners insert own provider"
  ON public.providers FOR INSERT TO authenticated
  WITH CHECK (owner_user_id = auth.uid());
CREATE POLICY "Owners update own provider"
  ON public.providers FOR UPDATE TO authenticated
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

CREATE TRIGGER trg_providers_updated
  BEFORE UPDATE ON public.providers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- blessings
-- ============================================================
CREATE TABLE IF NOT EXISTS public.blessings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid REFERENCES public.providers(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.assistance_categories(id) ON DELETE SET NULL,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  image_url text,
  shopify_product_id text,
  shopify_variant_id text,
  status text NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_blessings_provider ON public.blessings(provider_id);
CREATE INDEX IF NOT EXISTS idx_blessings_category ON public.blessings(category_id);

ALTER TABLE public.blessings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active blessings publicly readable"
  ON public.blessings FOR SELECT USING (
    status = 'ACTIVE'
    OR has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.providers p WHERE p.id = blessings.provider_id AND p.owner_user_id = auth.uid())
  );
CREATE POLICY "Admins manage blessings"
  ON public.blessings FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Providers manage own blessings"
  ON public.blessings FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.providers p WHERE p.id = blessings.provider_id AND p.owner_user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.providers p WHERE p.id = blessings.provider_id AND p.owner_user_id = auth.uid()));

CREATE TRIGGER trg_blessings_updated
  BEFORE UPDATE ON public.blessings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- cases (help requests)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id uuid NOT NULL,
  category_id uuid REFERENCES public.assistance_categories(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  target_amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'DRAFT',
  country text,
  region text,
  priority text NOT NULL DEFAULT 'NORMAL',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cases_recipient ON public.cases(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_cases_category ON public.cases(category_id);

ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved cases publicly readable"
  ON public.cases FOR SELECT USING (
    status IN ('APPROVED','OPEN','FUNDED')
    OR recipient_user_id = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
  );
CREATE POLICY "Recipients insert own cases"
  ON public.cases FOR INSERT TO authenticated
  WITH CHECK (recipient_user_id = auth.uid());
CREATE POLICY "Recipients update own cases"
  ON public.cases FOR UPDATE TO authenticated
  USING (recipient_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (recipient_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete cases"
  ON public.cases FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_cases_updated
  BEFORE UPDATE ON public.cases
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- sponsorships
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sponsorships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_user_id uuid NOT NULL,
  blessing_id uuid REFERENCES public.blessings(id) ON DELETE SET NULL,
  case_id uuid REFERENCES public.cases(id) ON DELETE SET NULL,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'PENDING',
  shopify_order_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sponsorships_sponsor ON public.sponsorships(sponsor_user_id);
CREATE INDEX IF NOT EXISTS idx_sponsorships_blessing ON public.sponsorships(blessing_id);
CREATE INDEX IF NOT EXISTS idx_sponsorships_case ON public.sponsorships(case_id);

ALTER TABLE public.sponsorships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sponsors read own sponsorships"
  ON public.sponsorships FOR SELECT TO authenticated
  USING (sponsor_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage sponsorships"
  ON public.sponsorships FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
-- Note: regular INSERT happens server-side via service role after Shopify webhook confirms payment.

CREATE TRIGGER trg_sponsorships_updated
  BEFORE UPDATE ON public.sponsorships
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- fulfillment_events
-- ============================================================
CREATE TABLE IF NOT EXISTS public.fulfillment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsorship_id uuid NOT NULL REFERENCES public.sponsorships(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  notes text,
  actor_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fulfillment_sponsorship ON public.fulfillment_events(sponsorship_id);

ALTER TABLE public.fulfillment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read fulfillment events"
  ON public.fulfillment_events FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.sponsorships s WHERE s.id = fulfillment_events.sponsorship_id AND s.sponsor_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.sponsorships s
      JOIN public.blessings b ON b.id = s.blessing_id
      JOIN public.providers p ON p.id = b.provider_id
      WHERE s.id = fulfillment_events.sponsorship_id AND p.owner_user_id = auth.uid()
    )
  );
CREATE POLICY "Admins and providers insert fulfillment events"
  ON public.fulfillment_events FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.sponsorships s
      JOIN public.blessings b ON b.id = s.blessing_id
      JOIN public.providers p ON p.id = b.provider_id
      WHERE s.id = fulfillment_events.sponsorship_id AND p.owner_user_id = auth.uid()
    )
  );