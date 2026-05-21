import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { approveAndSendReport } from "@/lib/flywheel.server";

export const listImpactReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("impact_reports" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) return { reports: [] as any[] };
    return { reports: (data ?? []) as any[] };
  });

export const approveFlywheelReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { reportId: string }) => input)
  .handler(async ({ data, context }) => {
    await approveAndSendReport(data.reportId, context.userId);
    return { ok: true };
  });
