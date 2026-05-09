
ALTER TABLE public.fulfillment_events
  ALTER COLUMN sponsorship_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS match_id uuid,
  ADD COLUMN IF NOT EXISTS provider text,
  ADD COLUMN IF NOT EXISTS status text,
  ADD COLUMN IF NOT EXISTS cost numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS idempotency_key text,
  ADD COLUMN IF NOT EXISTS response jsonb DEFAULT '{}'::jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS fulfillment_events_idem_key_uniq
  ON public.fulfillment_events(idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS fulfillment_events_match_id_idx
  ON public.fulfillment_events(match_id);

ALTER TABLE public.petri_matches
  ADD COLUMN IF NOT EXISTS execution_status text NOT NULL DEFAULT 'unfulfilled',
  ADD COLUMN IF NOT EXISTS provider text,
  ADD COLUMN IF NOT EXISTS cost numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS last_executed_at timestamptz;

-- Allow admins to read fulfillment events for matches (no sponsorship)
DROP POLICY IF EXISTS "Admins read all fulfillment events" ON public.fulfillment_events;
CREATE POLICY "Admins read all fulfillment events"
  ON public.fulfillment_events FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
