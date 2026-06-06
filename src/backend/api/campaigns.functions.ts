import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { filterAllowedByLocation } from "@/lib/data-sovereignty";

export const listCampaignsByCategory = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ slug: z.string().min(1).max(120) }).parse(input))
  .handler(async ({ data: input }) => {
    const slug = input.slug;
    const { data, error } = await supabaseAdmin
      .from("campaigns")
      .select("*")
      .eq("category_slug", slug);
    if (error) throw error;
    return filterAllowedByLocation(data ?? []);
  });

// Re-export real campaign + category readers from the canonical server module
// so the gateway façade resolves to actual DB-backed queries.
export {
  listCampaigns,
  getCampaignByHandle,
  type Campaign,
} from "@/backend/campaigns.functions";
