import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const getMyGiving = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { claims } = context;
    const email = (claims as { email?: string } | null)?.email ?? null;
    if (!email) return { donations: [], totalAmount: 0, count: 0 };

    const { data: donations } = await supabaseAdmin
      .from("donations")
      .select("id, amount, currency, message, is_anonymous, created_at, campaign_id, donor_name")
      .eq("donor_email", email)
      .order("created_at", { ascending: false })
      .limit(100);

    const list = donations ?? [];
    const campaignIds = Array.from(new Set(list.map((d) => d.campaign_id).filter(Boolean))) as string[];
    const { data: campaigns } = campaignIds.length
      ? await supabaseAdmin.from("campaigns").select("id, handle, title, image_url").in("id", campaignIds)
      : { data: [] };
    const campaignMap = new Map((campaigns ?? []).map((c) => [c.id, c]));

    return {
      donations: list.map((d) => ({ ...d, campaign: d.campaign_id ? campaignMap.get(d.campaign_id) ?? null : null })),
      totalAmount: list.reduce((s, d) => s + Number(d.amount ?? 0), 0),
      count: list.length,
    };
  });

