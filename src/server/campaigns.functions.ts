import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type Campaign = {
  id: string;
  handle: string;
  title: string;
  story: string | null;
  short_description: string | null;
  image_url: string | null;
  beneficiary_name: string | null;
  location: string | null;
  goal_amount: number;
  raised_amount: number;
  donor_count: number;
  currency: string;
  status: string;
  featured: boolean;
  shopify_product_id: string | null;
  shopify_variant_id: string | null;
  category_slug?: string | null;
};

export const listCampaigns = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("campaigns")
    .select("*")
    .eq("status", "active")
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) {
    console.error("listCampaigns error", error);
    return { campaigns: [] as Campaign[] };
  }
  return { campaigns: (data ?? []) as Campaign[] };
});

export const listCampaignsByCategory = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) =>
    z.object({ slug: z.string().min(1).max(80) }).parse(data),
  )
  .handler(async ({ data }) => {
    const [{ data: category }, { data: campaigns }] = await Promise.all([
      supabaseAdmin.from("categories").select("slug, name, description").eq("slug", data.slug).maybeSingle(),
      supabaseAdmin
        .from("campaigns")
        .select("*")
        .eq("status", "active")
        .eq("category_slug", data.slug)
        .order("created_at", { ascending: false }),
    ]);
    return { category, campaigns: (campaigns ?? []) as Campaign[] };
  });

export const getCampaignByHandle = createServerFn({ method: "GET" })
  .inputValidator((data: { handle: string }) =>
    z.object({ handle: z.string().min(1).max(255) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { data: campaign, error } = await supabaseAdmin
      .from("campaigns")
      .select("*")
      .eq("handle", data.handle)
      .maybeSingle();
    if (error) {
      console.error("getCampaignByHandle error", error);
      return { campaign: null, donations: [] };
    }
    if (!campaign) return { campaign: null, donations: [] };
    const { data: donations } = await supabaseAdmin
      .from("donations")
      .select("id, amount, currency, donor_name, message, is_anonymous, created_at")
      .eq("campaign_id", campaign.id)
      .order("created_at", { ascending: false })
      .limit(20);
    return { campaign: campaign as Campaign, donations: donations ?? [] };
  });