-- Restrict access to recipient address fields on cases
REVOKE SELECT (address_line1, city, state, postal_code, country) ON public.cases FROM anon;
REVOKE SELECT (address_line1, city, state, postal_code, country) ON public.cases FROM authenticated;
-- Re-grant to service_role explicitly (already has ALL but be explicit)
GRANT SELECT ON public.cases TO service_role;

-- Lock down realtime.messages so authenticated clients can only subscribe to the campaigns topic
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can subscribe to campaigns topic" ON realtime.messages;
CREATE POLICY "Authenticated can subscribe to campaigns topic"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (topic = 'campaigns');