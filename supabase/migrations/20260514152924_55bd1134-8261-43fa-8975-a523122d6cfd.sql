-- 1. Idempotency on fulfillment_events
CREATE UNIQUE INDEX IF NOT EXISTS fulfillment_events_idempotency_key_uidx
  ON public.fulfillment_events (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- 2. Atomic campaign totals increment (handles negative amount for refunds)
CREATE OR REPLACE FUNCTION public.increment_campaign_totals(
  _campaign_id uuid,
  _amount numeric,
  _donor_delta integer DEFAULT 1
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.campaigns
     SET raised_amount = GREATEST(0, raised_amount + _amount),
         donor_count   = GREATEST(0, donor_count + _donor_delta),
         updated_at    = now()
   WHERE id = _campaign_id;
$$;

REVOKE ALL ON FUNCTION public.increment_campaign_totals(uuid, numeric, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_campaign_totals(uuid, numeric, integer) TO service_role;

-- 3. Ledger reversal helper: posts mirror entries (extend-only, never mutates prior rows)
CREATE OR REPLACE FUNCTION public.reverse_donation_ledger(
  _donation_id uuid,
  _reason text DEFAULT 'refund'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT account, side, amount, currency
      FROM public.ledger_entries
     WHERE donation_id = _donation_id
       AND memo NOT LIKE 'REVERSAL:%'
  LOOP
    INSERT INTO public.ledger_entries (donation_id, account, side, amount, currency, memo)
    VALUES (
      _donation_id,
      r.account,
      CASE WHEN r.side = 'debit' THEN 'credit' ELSE 'debit' END,
      r.amount,
      r.currency,
      'REVERSAL: ' || _reason
    );
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.reverse_donation_ledger(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reverse_donation_ledger(uuid, text) TO service_role;