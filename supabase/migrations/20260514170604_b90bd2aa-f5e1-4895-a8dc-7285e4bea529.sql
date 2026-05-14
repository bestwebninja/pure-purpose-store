CREATE TABLE public.system_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_key text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  country_code text,
  autonomy_level integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT system_modules_autonomy_range CHECK (autonomy_level BETWEEN 0 AND 3),
  CONSTRAINT system_modules_key_country_unique UNIQUE (module_key, country_code)
);

ALTER TABLE public.system_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage system modules"
  ON public.system_modules
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_system_modules_updated_at
  BEFORE UPDATE ON public.system_modules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.system_modules (module_key, autonomy_level, enabled) VALUES
  ('matching', 1, true),
  ('fulfillment', 1, true),
  ('payouts', 0, true),
  ('moderation', 2, true),
  ('ngo_trust', 1, true),
  ('treasury', 0, true),
  ('suppliers', 1, true)
ON CONFLICT (module_key, country_code) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'fulfillment_events'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.fulfillment_events';
  END IF;
END $$;
