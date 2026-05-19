import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listMatchesForControl = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("matches" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    return { matches: (data ?? []) as any[] };
  });

export const approveMatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    await context.supabase.from("matches" as any).update({ status: "approved" }).eq("id", data.id);
    return { ok: true };
  });

export const rejectMatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    await context.supabase.from("matches" as any).update({ status: "rejected" }).eq("id", data.id);
    return { ok: true };
  });

export const executeMatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    await context.supabase
      .from("matches" as any)
      .update({ execution_status: "executed", last_executed_at: new Date().toISOString() })
      .eq("id", data.id);
    return { ok: true };
  });

export const listFulfillmentForMatch = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: events } = await context.supabase
      .from("fulfillment_events" as any)
      .select("*")
      .eq("match_id", data.id)
      .order("created_at", { ascending: false });
    return { events: (events ?? []) as any[] };
  });