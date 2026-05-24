
DROP POLICY IF EXISTS "Donations are publicly readable" ON public.donations;
CREATE POLICY "Admins can read donations"
  ON public.donations FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

ALTER PUBLICATION supabase_realtime DROP TABLE public.cases;
ALTER PUBLICATION supabase_realtime DROP TABLE public.fulfillment_events;
ALTER PUBLICATION supabase_realtime DROP TABLE public.ngo_applications;
ALTER PUBLICATION supabase_realtime DROP TABLE public.petri_matches;
ALTER PUBLICATION supabase_realtime DROP TABLE public.donations;

CREATE POLICY "Authenticated can read system modules"
  ON public.system_modules FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins manage webhook events"
  ON public.webhook_events FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

REVOKE EXECUTE ON FUNCTION public.increment_campaign_totals(uuid, numeric, integer) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.reverse_donation_ledger(uuid, text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.next_invoice_number() FROM anon, authenticated, public;

DROP POLICY IF EXISTS "Avatars are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Sponsor logos publicly readable" ON storage.objects;
