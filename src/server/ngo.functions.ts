import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const SubmitSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  country: z.string().trim().min(2).max(80),
  causes: z.array(z.string().min(1).max(60)).min(1).max(10),
  geography: z.string().trim().min(2).max(120),
});

// TODO: Replace stub with real intelligence/compliance check.
function runIntelligenceCheck(input: { name: string; email: string }) {
  const score = Math.floor(60 + Math.random() * 35);
  return {
    trust_score: score,
    intelligence_status: score > 75 ? "AUTO_REVIEWED" : "PENDING_REVIEW",
  };
}

export const submitNgoApplication = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SubmitSchema.parse(input))
  .handler(async ({ data }) => {
    const intel = runIntelligenceCheck({ name: data.name, email: data.email });
    const { data: row, error } = await supabaseAdmin
      .from("ngo_applications")
      .insert({
        name: data.name,
        email: data.email,
        country: data.country,
        causes: data.causes,
        geography: data.geography,
        status: "PENDING",
        trust_score: intel.trust_score,
        intelligence_status: intel.intelligence_status,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("audit_logs").insert({
      action: "NGO_SUBMITTED",
      entity_type: "ngo_application",
      entity_id: row.id,
      metadata: { name: data.name, email: data.email, intel },
    });

    return { id: row.id, ...intel };
  });

export const listNgoApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data: roleRow } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) throw new Error("Forbidden: admin role required");

    const { data, error } = await supabaseAdmin
      .from("ngo_applications")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { applications: data ?? [] };
  });

const UpdateStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["ACTIVE", "REJECTED", "PENDING"]),
});

export const updateNgoStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => UpdateStatusSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: roleRow } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) throw new Error("Forbidden: admin role required");

    const { error } = await supabaseAdmin
      .from("ngo_applications")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("audit_logs").insert({
      actor_id: userId,
      action: data.status === "ACTIVE" ? "NGO_APPROVED" : data.status === "REJECTED" ? "NGO_REJECTED" : "NGO_STATUS_CHANGED",
      entity_type: "ngo_application",
      entity_id: data.id,
      metadata: { status: data.status },
    });

    return { ok: true };
  });

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    return { isAdmin: !!data };
  });

export const listCategories = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return { categories: data ?? [] };
});