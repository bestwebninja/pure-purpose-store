
-- Invoices: dual-purpose tax receipt + platform fee invoice
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL UNIQUE,
  sponsor_user_id uuid NOT NULL,
  donation_id uuid REFERENCES public.donations(id) ON DELETE SET NULL,
  sponsorship_id uuid REFERENCES public.sponsorships(id) ON DELETE SET NULL,
  gross_amount numeric NOT NULL DEFAULT 0,
  donation_amount numeric NOT NULL DEFAULT 0,         -- tax-deductible portion (93.5%)
  platform_fee_amount numeric NOT NULL DEFAULT 0,     -- non-deductible software fee (6.5%)
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'ISSUED',              -- ISSUED | VOID
  issued_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_invoices_sponsor ON public.invoices(sponsor_user_id);
CREATE UNIQUE INDEX idx_invoices_unique_donation
  ON public.invoices(donation_id) WHERE donation_id IS NOT NULL;

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sponsors read own invoices"
  ON public.invoices FOR SELECT TO authenticated
  USING (sponsor_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage invoices"
  ON public.invoices FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Sequence + helper for invoice numbering
CREATE SEQUENCE IF NOT EXISTS public.invoice_number_seq START 1000;

CREATE OR REPLACE FUNCTION public.next_invoice_number()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 'INV-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.invoice_number_seq')::text, 6, '0');
$$;
