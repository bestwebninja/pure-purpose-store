import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Dual invoicing split:
 *   93.5% → tax-deductible donation portion (issued to the cause / NGO)
 *   6.5%  → MyBlessings platform software fee (non-deductible)
 */
const DONATION_PCT = 0.935;
const PLATFORM_PCT = 0.065;
const round2 = (n: number) => Math.round(n * 100) / 100;

type InvoiceRow = {
  id: string;
  invoice_number: string;
  sponsor_user_id: string;
  donation_id: string | null;
  sponsorship_id: string | null;
  gross_amount: number;
  donation_amount: number;
  platform_fee_amount: number;
  currency: string;
  status: string;
  issued_at: string;
};

/**
 * Create (or return existing) invoice for a single donation.
 * Idempotent via the unique index on invoices.donation_id.
 */
export const generateInvoiceForDonation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ donationId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;

    const { data: donation, error: dErr } = await supabaseAdmin
      .from("donations")
      .select("id, amount, currency, donor_email")
      .eq("id", data.donationId)
      .maybeSingle();
    if (dErr) throw new Error(dErr.message);
    if (!donation) throw new Error("Donation not found");

    // Existing invoice → return it
    const { data: existing } = await supabaseAdmin
      .from("invoices")
      .select("*")
      .eq("donation_id", donation.id)
      .maybeSingle();
    if (existing) return { invoice: existing as InvoiceRow };

    const gross = Number(donation.amount ?? 0);
    const donationAmount = round2(gross * DONATION_PCT);
    const platformFee = round2(gross - donationAmount);

    const { data: numRow, error: nErr } = await supabaseAdmin.rpc("next_invoice_number");
    if (nErr) throw new Error(nErr.message);
    const invoiceNumber = String(numRow);

    const { data: inserted, error: iErr } = await supabaseAdmin
      .from("invoices")
      .insert({
        invoice_number: invoiceNumber,
        sponsor_user_id: userId,
        donation_id: donation.id,
        gross_amount: gross,
        donation_amount: donationAmount,
        platform_fee_amount: platformFee,
        currency: donation.currency ?? "USD",
        metadata: { donor_email: donation.donor_email },
      })
      .select("*")
      .single();
    if (iErr) throw new Error(iErr.message);

    return { invoice: inserted as InvoiceRow };
  });

/**
 * Backfill: ensure every donation made under this sponsor's email has an invoice,
 * then return the full list (most recent first). Date range optional.
 */
export const listSponsorInvoices = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        from: z.string().datetime().optional(),
        to: z.string().datetime().optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Resolve sponsor's email (used to match donations donor_email)
    const { data: userRes } = await supabase.auth.getUser();
    const email = userRes.user?.email ?? null;

    if (email) {
      let q = supabaseAdmin
        .from("donations")
        .select("id, amount, currency, donor_email, created_at")
        .eq("donor_email", email);
      if (data.from) q = q.gte("created_at", data.from);
      if (data.to) q = q.lte("created_at", data.to);
      const { data: donations } = await q;

      if (donations?.length) {
        // Optimization: Batch check for existing invoices to avoid N+1 queries
        const donationIds = donations.map(d => d.id);
        const { data: existingInvoices } = await supabaseAdmin
          .from("invoices")
          .select("donation_id")
          .in("donation_id", donationIds);
        
        const existingMap = new Set(existingInvoices?.map(i => i.donation_id));

        for (const d of donations) {
          if (existingMap.has(d.id)) continue;

        const gross = Number(d.amount ?? 0);
        const donationAmount = round2(gross * DONATION_PCT);
        const platformFee = round2(gross - donationAmount);
        const { data: numRow } = await supabaseAdmin.rpc("next_invoice_number");
        await supabaseAdmin.from("invoices").insert({
          invoice_number: String(numRow),
          sponsor_user_id: userId,
          donation_id: d.id,
          gross_amount: gross,
          donation_amount: donationAmount,
          platform_fee_amount: platformFee,
          currency: d.currency ?? "USD",
          metadata: { donor_email: d.donor_email },
        });
        }
      }
    }

    let q = supabaseAdmin
      .from("invoices")
      .select("*")
      .eq("sponsor_user_id", userId)
      .order("issued_at", { ascending: false });
    if (data.from) q = q.gte("issued_at", data.from);
    if (data.to) q = q.lte("issued_at", data.to);
    const { data: invoices, error } = await q;
    if (error) throw new Error(error.message);

    return { invoices: (invoices ?? []) as InvoiceRow[] };
  });