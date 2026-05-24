import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const listCampaignsByCategory = createServerFn({ method: "GET" })
  .inputValidator((slug: unknown) => z.string().min(1).max(120).parse(slug))
  .handler(async ({ data: slug }) => {
    const { data, error } = await supabaseAdmin
      .from("campaigns")
      .select("*")
      .eq("category_slug", slug);
    if (error) throw error;
    return data ?? [];
  });
