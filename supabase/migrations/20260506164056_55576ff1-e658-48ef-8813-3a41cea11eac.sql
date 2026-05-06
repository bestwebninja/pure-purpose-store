-- Minimal real audit/ledger layer (double-entry over donations)
CREATE TABLE public.ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id uuid REFERENCES public.donations(id) ON DELETE CASCADE,
  account text NOT NULL,
  side text NOT NULL CHECK (side IN ('debit','credit')),
  amount numeric NOT NULL CHECK (amount >= 0),
  currency text NOT NULL DEFAULT 'USD',
  memo text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ledger_entries_donation ON public.ledger_entries(donation_id);
CREATE INDEX idx_ledger_entries_account ON public.ledger_entries(account);

ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read ledger"
  ON public.ledger_entries FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- No INSERT/UPDATE/DELETE policies → only service role (server) can write.
