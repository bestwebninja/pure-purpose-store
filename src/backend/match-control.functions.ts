import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertAdmin(userId: string) {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden: admin role required");
}

async function writeAudit(actorId: string, action: string, entityId: string, metadata: Record<string, unknown> = {}) {
  const { error } = await supabaseAdmin.from("audit_logs").insert({
    actor_id: actorId,
    action,
    entity_type: "match",
    entity_id: entityId,
    metadata,
  });
  if (error) console.error("[match-control.audit] insert failed", { action, entityId, error: error.message });
}

export const listMatchesForControl = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data } = await context.supabase
      .from("petri_matches")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    return { matches: (data ?? []) as any[] };
  });

export const approveMatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await context.supabase.from("petri_matches").update({ status: "approved" }).eq("id", data.id);
    if (error) { console.error("[match-control.approveMatch] failed", { id: data.id, error: error.message }); throw new Error(error.message); }
    await writeAudit(context.userId, "MATCH_APPROVED", data.id, { status: "approved" });
    return { ok: true };
  });

export const rejectMatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await context.supabase.from("petri_matches").update({ status: "rejected" }).eq("id", data.id);
    if (error) { console.error("[match-control.rejectMatch] failed", { id: data.id, error: error.message }); throw new Error(error.message); }
    await writeAudit(context.userId, "MATCH_REJECTED", data.id, { status: "rejected" });
    return { ok: true };
  });

export const executeMatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    // Idempotency: only flip unexecuted rows. Returning rows tells us whether a transition actually happened.
    const { data: updated, error } = await context.supabase
      .from("petri_matches")
      .update({ execution_status: "executed", last_executed_at: new Date().toISOString() })
      .eq("id", data.id)
      .neq("execution_status", "executed")
      .select("id");
    if (error) { console.error("[match-control.executeMatch] failed", { id: data.id, error: error.message }); throw new Error(error.message); }
    const alreadyExecuted = !updated || updated.length === 0;
    if (!alreadyExecuted) {
      await writeAudit(context.userId, "MATCH_EXECUTED", data.id, { execution_status: "executed" });
    }
    return { ok: true, alreadyExecuted };
  });

export const listFulfillmentForMatch = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { data: events } = await context.supabase
      .from("fulfillment_events")
      .select("*")
      .eq("match_id", data.id)
      .order("created_at", { ascending: false });
    return { events: (events ?? []) as any[] };
  });
