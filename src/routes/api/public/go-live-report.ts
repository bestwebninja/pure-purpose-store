import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Read-only system report. Aggregates real signals from the database.
 * No fake "kernel/governor/runtime lock" — only what actually exists.
 */
export const Route = createFileRoute("/api/public/go-live-report")({
  server: {
    handlers: {
      GET: async () => {
        const checks: Record<string, { ok: boolean; detail?: unknown }> = {};

        // 1. DB connectivity
        try {
          const { error } = await supabaseAdmin.from("campaigns").select("id").limit(1);
          checks.database = { ok: !error, detail: error?.message };
        } catch (e) {
          checks.database = { ok: false, detail: String(e) };
        }

        // 2. Shopify webhook secret configured
        checks.shopify_ingress = {
          ok: !!process.env.SHOPIFY_WEBHOOK_SECRET,
          detail: process.env.SHOPIFY_WEBHOOK_SECRET ? "secret configured" : "SHOPIFY_WEBHOOK_SECRET missing",
        };

        // 3. Ledger integrity: per-donation debits == credits
        let ledgerOk = true;
        let ledgerDetail: unknown = "no entries";
        try {
          const { data: entries, error } = await supabaseAdmin
            .from("ledger_entries")
            .select("donation_id, side, amount");
          if (error) {
            ledgerOk = false;
            ledgerDetail = error.message;
          } else if (entries && entries.length) {
            const totals = new Map<string, { d: number; c: number }>();
            for (const e of entries) {
              const key = e.donation_id ?? "_null";
              const t = totals.get(key) ?? { d: 0, c: 0 };
              if (e.side === "debit") t.d += Number(e.amount);
              else t.c += Number(e.amount);
              totals.set(key, t);
            }
            const unbalanced: string[] = [];
            for (const [k, t] of totals) {
              if (Math.abs(t.d - t.c) > 0.001) unbalanced.push(k);
            }
            ledgerOk = unbalanced.length === 0;
            ledgerDetail = { donations: totals.size, unbalanced };
          }
        } catch (e) {
          ledgerOk = false;
          ledgerDetail = String(e);
        }
        checks.ledger_integrity = { ok: ledgerOk, detail: ledgerDetail };

        // 4. Donation pipeline: count of donations vs webhook events seen
        try {
          const [{ count: donations }, { count: events }] = await Promise.all([
            supabaseAdmin.from("donations").select("*", { count: "exact", head: true }),
            supabaseAdmin.from("webhook_events").select("*", { count: "exact", head: true }),
          ]);
          checks.event_pipeline = {
            ok: true,
            detail: { donations: donations ?? 0, webhook_events: events ?? 0 },
          };
        } catch (e) {
          checks.event_pipeline = { ok: false, detail: String(e) };
        }

        // 5. Campaigns published
        try {
          const { count } = await supabaseAdmin
            .from("campaigns")
            .select("*", { count: "exact", head: true })
            .eq("status", "active");
          checks.campaigns = { ok: (count ?? 0) > 0, detail: { active: count ?? 0 } };
        } catch (e) {
          checks.campaigns = { ok: false, detail: String(e) };
        }

        const live = Object.values(checks).every((c) => c.ok);

        return Response.json(
          {
            live,
            mode: live ? "LIVE" : "NOT_LIVE",
            checks,
            timestamp: new Date().toISOString(),
          },
          { status: live ? 200 : 503 },
        );
      },
    },
  },
});