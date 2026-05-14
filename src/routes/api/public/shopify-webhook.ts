import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Shopify Order webhook handler.
 *
 * Configure in Shopify Admin → Settings → Notifications → Webhooks:
 *   Topic: "Order creation" (and/or "Order paid")
 *   URL: https://<your-domain>/api/public/shopify-webhook
 *   Format: JSON
 *
 * Set the SHOPIFY_WEBHOOK_SECRET env var to the secret Shopify gives you.
 * If the secret is not set, the route refuses requests.
 */
export const Route = createFileRoute("/api/public/shopify-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
        if (!secret) {
          console.error("SHOPIFY_WEBHOOK_SECRET not configured");
          return new Response("Webhook not configured", { status: 500 });
        }

        // Fee splits as decimal fractions (0.029 = 2.9%). Default to 0 so prior
        // "100% to beneficiary" behavior is preserved unless operators opt in.
        const PROCESSOR_FEE_PCT = Number(process.env.PROCESSOR_FEE_PCT ?? "0");
        const PLATFORM_FEE_PCT = Number(process.env.PLATFORM_FEE_PCT ?? "0");
        const round2 = (n: number) => Math.round(n * 100) / 100;

        const hmacHeader = request.headers.get("x-shopify-hmac-sha256");
        const eventId = request.headers.get("x-shopify-webhook-id") ?? "";
        const topic = request.headers.get("x-shopify-topic") ?? "";
        const raw = await request.text();

        if (!hmacHeader) return new Response("Missing signature", { status: 401 });

        const computed = createHmac("sha256", secret).update(raw, "utf8").digest("base64");
        const a = Buffer.from(hmacHeader);
        const b = Buffer.from(computed);
        if (a.length !== b.length || !timingSafeEqual(a, b)) {
          return new Response("Invalid signature", { status: 401 });
        }

        // Idempotency: if we've seen this webhook id, ack and stop.
        if (eventId) {
          const { error: dupErr } = await supabaseAdmin
            .from("webhook_events")
            .insert({ source: "shopify", event_id: eventId, topic });
          if (dupErr) {
            // Unique violation = already processed → ack so Shopify stops retrying.
            console.log("Duplicate Shopify webhook", eventId, dupErr.message);
            return new Response("ok", { status: 200 });
          }
        }

        type ShopifyAttribute = { name: string; value: string };
        type ShopifyOrder = {
          id: number | string;
          checkout_id?: number | string;
          financial_status?: string;
          total_price?: string;
          currency?: string;
          customer?: { first_name?: string; last_name?: string; email?: string };
          email?: string;
          note_attributes?: ShopifyAttribute[];
        };

        let payload: ShopifyOrder;
        try {
          payload = JSON.parse(raw) as ShopifyOrder;
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const orderId = String(payload.id);

        // Refund / cancellation: post mirror ledger entries and decrement totals.
        const isReversal =
          topic === "orders/refunded" ||
          topic === "orders/cancelled" ||
          payload.financial_status === "refunded" ||
          payload.financial_status === "voided";
        if (isReversal) {
          const { data: existing } = await supabaseAdmin
            .from("donations")
            .select("id, amount, campaign_id")
            .eq("shopify_order_id", orderId)
            .maybeSingle();
          if (existing && existing.campaign_id) {
            await supabaseAdmin.rpc("reverse_donation_ledger", {
              _donation_id: existing.id,
              _reason: topic || "reversal",
            });
            await supabaseAdmin.rpc("increment_campaign_totals", {
              _campaign_id: existing.campaign_id,
              _amount: -Number(existing.amount ?? 0),
              _donor_delta: -1,
            });
          }
          return new Response("ok", { status: 200 });
        }

        // Only process paid orders
        const isPaid =
          topic === "orders/paid" ||
          payload.financial_status === "paid" ||
          payload.financial_status === "partially_paid";
        if (!isPaid) return new Response("ok", { status: 200 });

        const attrs = Object.fromEntries(
          (payload.note_attributes ?? []).map((a) => [a.name, a.value]),
        );
        const campaignId = attrs.campaign_id;
        if (!campaignId) {
          console.warn("Shopify order missing campaign_id attribute", payload.id);
          return new Response("ok", { status: 200 });
        }

        const amount = Number(payload.total_price ?? 0);

        const donorName =
          attrs.is_anonymous === "true"
            ? null
            : attrs.donor_name ||
              [payload.customer?.first_name, payload.customer?.last_name].filter(Boolean).join(" ") ||
              null;

        // Insert donation (unique on shopify_order_id → second-layer idempotency)
        const { error: donationErr } = await supabaseAdmin.from("donations").insert({
          campaign_id: campaignId,
          shopify_order_id: orderId,
          shopify_checkout_id: payload.checkout_id ? String(payload.checkout_id) : null,
          amount,
          currency: payload.currency ?? "USD",
          donor_name: donorName,
          donor_email: payload.customer?.email ?? payload.email ?? null,
          message: attrs.donor_message || null,
          is_anonymous: attrs.is_anonymous === "true",
        });

        if (donationErr) {
          // duplicate order → already counted
          if (donationErr.code === "23505") return new Response("ok", { status: 200 });
          console.error("donation insert error", donationErr);
          return new Response("DB error", { status: 500 });
        }

        // Look up the inserted donation id for ledger linkage
        const { data: donationRow } = await supabaseAdmin
          .from("donations")
          .select("id")
          .eq("shopify_order_id", orderId)
          .maybeSingle();

        // Double-entry posting (split):
        //   DR cash                       (net received from Shopify)
        //   DR payment_processor_fees     (Shopify/Stripe processing cost)
        //   CR platform_fee_revenue       (MyBlessings platform cut)
        //   CR beneficiary_payable        (liability owed to the cause)
        // Defaults to 0% / 0% which collapses to: DR cash / CR beneficiary_payable
        // (still correct double-entry, just with no fee split).
        if (donationRow) {
          const currency = payload.currency ?? "USD";
          const processorFee = round2(amount * PROCESSOR_FEE_PCT);
          const platformFee = round2(amount * PLATFORM_FEE_PCT);
          const cashNet = round2(amount - processorFee);
          const beneficiaryPayable = round2(amount - processorFee - platformFee);
          const memo = `Shopify order ${orderId}`;
          const entries: Array<{
            donation_id: string; account: string; side: "debit" | "credit";
            amount: number; currency: string; memo: string;
          }> = [
            { donation_id: donationRow.id, account: "cash", side: "debit", amount: cashNet, currency, memo },
          ];
          if (processorFee > 0) {
            entries.push({ donation_id: donationRow.id, account: "payment_processor_fees", side: "debit", amount: processorFee, currency, memo });
          }
          if (platformFee > 0) {
            entries.push({ donation_id: donationRow.id, account: "platform_fee_revenue", side: "credit", amount: platformFee, currency, memo });
          }
          entries.push({ donation_id: donationRow.id, account: "beneficiary_payable", side: "credit", amount: beneficiaryPayable, currency, memo });
          const { error: ledgerErr } = await supabaseAdmin.from("ledger_entries").insert(entries);
          if (ledgerErr) console.error("ledger insert error", ledgerErr);
        }

        // Atomic campaign totals (no read-modify-write race between concurrent webhooks)
        const { error: incErr } = await supabaseAdmin.rpc("increment_campaign_totals", {
          _campaign_id: campaignId,
          _amount: amount,
          _donor_delta: 1,
        });
        if (incErr) console.error("campaign increment error", incErr);

        return new Response("ok", { status: 200 });
      },
    },
  },
});