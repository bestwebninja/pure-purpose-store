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
        const orderId = String(payload.id);

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

        // Bump campaign totals via SQL increment
        const { data: current } = await supabaseAdmin
          .from("campaigns")
          .select("raised_amount, donor_count")
          .eq("id", campaignId)
          .maybeSingle();

        if (current) {
          await supabaseAdmin
            .from("campaigns")
            .update({
              raised_amount: Number(current.raised_amount) + amount,
              donor_count: Number(current.donor_count) + 1,
            })
            .eq("id", campaignId);
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});