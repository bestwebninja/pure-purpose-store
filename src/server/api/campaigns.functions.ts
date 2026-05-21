import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

export const listCampaignsByCategory = createServerFn()
  .handler(async ({ data: slug }: { data: string }) => {
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("category_slug", slug);

    if (error) throw error;
    return data ?? [];
  });
