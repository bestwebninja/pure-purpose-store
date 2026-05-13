import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * STUB: Followup engine. Logs an immutable fulfillment_event of type
 * "followup_active" so dashboards can count active followups today.
 * Replace with scheduler + outreach adapters in a follow-up.
 */
export const startFollowup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ matchId: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const idempotency_key = `match:${data.matchId}:followup:v1`;
    const existing = await supabaseAdmin
      .from("fulfillment_events")
      .select("id")
      .eq("idempotency_key", idempotency_key)
      .maybeSingle();
    if (existing.data) return { ok: true, replay: true, event_id: existing.data.id };

    const inserted = await supabaseAdmin
      .from("fulfillment_events")
      .insert({
        match_id: data.matchId,
        event_type: "followup_active",
        provider: "stub",
        status: "executed",
        cost: 0,
        currency: "USD",
        idempotency_key,
        notes: "stub_followup_started",
      })
      .select("id")
      .single();
    return { ok: true, event_id: inserted.data?.id ?? null };
  });