import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  approveAndSendReport,
  generateSponsorFlywheelReport,
} from "./flywheel.server";

async function assertAdmin(userId: string): Promise<void> {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden — admin role required.");
}

/**
 * Operator-triggered flywheel run for a single sponsor + completed package.
 * Compiles proof artifacts, generates next month's package, and either
 * auto-sends (L3) or drafts for review (L0–L2).
 */
export const generateFlywheelReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        sponsorUserId: z.string().uuid(),
        packageSignature: z.string().min(16),
        packageTotal: z.number().min(0),
        currency: z.string().min(3).max(8).optional(),
        sponsorshipIds: z.array(z.string().uuid()).max(50).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    return generateSponsorFlywheelReport({
      sponsorUserId: data.sponsorUserId,
      packageSignature: data.packageSignature,
      packageTotal: data.packageTotal,
      currency: data.currency,
      sponsorshipIds: data.sponsorshipIds,
    });
  });

/** Operator approves a drafted report and sends it. */
export const approveFlywheelReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ reportId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    await approveAndSendReport(data.reportId, context.userId);
    return { ok: true as const, report_id: data.reportId };
  });

/** Admin-only listing for the God View "Sponsor Reports" tab. */
export const listImpactReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("impact_reports")
      .select(
        "id, sponsor_user_id, sponsor_id, package_signature, package_total, currency, status, summary, autonomy_level, sent_at, created_at, updated_at, next_package",
      )
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return { reports: data ?? [] };
  });
