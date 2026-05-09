import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { routeMatchToFulfillment } from "./fulfillment-router.server";

async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin role required");
}

export const listMatchesForControl = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("petri_matches")
      .select("id, status, score, confidence_score, execution_status, provider, cost, currency, category, last_executed_at, created_at, help_request_id, sponsor_id")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return { matches: data ?? [] };
  });

const IdInput = z.object({ id: z.string().uuid() });

export const approveMatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => IdInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { data: match, error } = await supabaseAdmin
      .from("petri_matches")
      .update({ status: "confirmed" })
      .eq("id", data.id)
      .select("id, category, score, confidence_score, help_request_id, sponsor_id")
      .single();
    if (error) throw new Error(error.message);
    const result = await routeMatchToFulfillment(match);
    return { ok: true, result };
  });

export const rejectMatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => IdInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("petri_matches")
      .update({ status: "rejected", execution_status: "skipped" })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const executeMatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => IdInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { data: match, error } = await supabaseAdmin
      .from("petri_matches")
      .select("id, category, score, confidence_score, help_request_id, sponsor_id")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    const result = await routeMatchToFulfillment(match);
    return { ok: true, result };
  });

export const listFulfillmentForMatch = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => IdInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { data: events, error } = await supabaseAdmin
      .from("fulfillment_events")
      .select("id, provider, status, cost, currency, notes, created_at")
      .eq("match_id", data.id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { events: events ?? [] };
  });