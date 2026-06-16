
-- 1) Protect sensitive recipient PII on public.cases via column-level privileges.
--    RLS rows still match the existing policy, but anon/authenticated cannot
--    read these columns. Service-role (admin server code) is unaffected.
REVOKE SELECT (address_line1, city, postal_code, salutation) ON public.cases FROM anon;
REVOKE SELECT (address_line1, city, postal_code, salutation) ON public.cases FROM authenticated;

-- 2) Document intentional public read access for the avatars bucket.
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
CREATE POLICY "Public can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- 3) Document intentional public read access for sponsor logos.
DROP POLICY IF EXISTS "Public can view sponsor logos" ON storage.objects;
CREATE POLICY "Public can view sponsor logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'sponsor-logos');
