-- 1. Add logo_url and doc_url to sponsors
ALTER TABLE public.sponsors
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS doc_url  TEXT;

-- 2. Create storage buckets (idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('sponsor-logos', 'sponsor-logos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('sponsor-docs', 'sponsor-docs', false)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage policies
-- Public read for logos
DROP POLICY IF EXISTS "Sponsor logos publicly readable" ON storage.objects;
CREATE POLICY "Sponsor logos publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'sponsor-logos');

-- Sponsors manage their own files (folder = auth.uid())
DROP POLICY IF EXISTS "Sponsors upload own logo" ON storage.objects;
CREATE POLICY "Sponsors upload own logo"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'sponsor-logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Sponsors update own logo" ON storage.objects;
CREATE POLICY "Sponsors update own logo"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'sponsor-logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Sponsors delete own logo" ON storage.objects;
CREATE POLICY "Sponsors delete own logo"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'sponsor-logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Sponsor docs: private, owner-only read + admin read
DROP POLICY IF EXISTS "Sponsors read own doc" ON storage.objects;
CREATE POLICY "Sponsors read own doc"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'sponsor-docs'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);

DROP POLICY IF EXISTS "Sponsors upload own doc" ON storage.objects;
CREATE POLICY "Sponsors upload own doc"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'sponsor-docs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Sponsors update own doc" ON storage.objects;
CREATE POLICY "Sponsors update own doc"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'sponsor-docs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Sponsors delete own doc" ON storage.objects;
CREATE POLICY "Sponsors delete own doc"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'sponsor-docs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);