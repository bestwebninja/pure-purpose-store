import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { recomputePetriScoresCore, type RecomputeResult } from "@/server/petri-recompute.server";

/**
 * Admin-only entry point for the PETRI Brain Recompute Loop.
 * Heuristic, auditable scoring — no LLM calls in the hot path.
 */
export const recomputePetriScores = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ limit: z.number().int().min(1).max(2000).optional() }).parse(input ?? {}))
  .handler(async ({ context, data }): Promise<RecomputeResult> => {
    const { supabase, userId } = context;
    // Verify admin role using the request-scoped client (RLS gives admins full read).
    const { data: roleRow, error: roleErr } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (roleErr || !roleRow) {
      throw new Error("Forbidden: admin role required");
    }
    return recomputePetriScoresCore({ limit: data.limit ?? 500, trigger: "admin" });
  });
