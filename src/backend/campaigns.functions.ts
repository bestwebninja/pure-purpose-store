import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "../integrations/supabase/client.server";
import { filterAllowedByLocation, isAllowedLocation } from "@/lib/data-sovereignty";

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
    .limit(200);
  if (error) {
    console.error("listCampaigns error", error);
    return { campaigns: [] as Campaign[] };
  }
  return { campaigns: filterAllowedByLocation((data ?? []) as Campaign[]).slice(0, 50) };
});

export const listCampaignsByCategory = createServerFn({ method: "GET" })
  .inputValidator((slug: string) => z.string().min(1).max(80).parse(slug))
  .handler(async ({ data: slug }) => {
    const [{ data: category }, { data: campaigns }] = await Promise.all([
      supabaseAdmin.from("categories").select("slug, name, description").eq("slug", slug).maybeSingle(),
      supabaseAdmin
        .from("campaigns")
        .select("*")
        .eq("status", "active")
        .eq("category_slug", slug)
        .order("created_at", { ascending: false }),
    ]);
    return { category, campaigns: filterAllowedByLocation((campaigns ?? []) as Campaign[]) };
  });

export const getCampaignByHandle = createServerFn({ method: "GET" })
  .inputValidator((handle: string) => z.string().min(1).max(255).parse(handle))
  .handler(async ({ data: handle }) => {
    const { data: campaign, error } = await supabaseAdmin.from("campaigns").select("*").eq("handle", handle).maybeSingle();
    if (error) return { campaign: null, donations: [] };
    if (!campaign) return { campaign: null, donations: [] };
    if (!isAllowedLocation((campaign as Campaign).location)) {
      return { campaign: null, donations: [] };
    }
    const { data: donations } = await supabaseAdmin.from("donations").select("id, amount, currency, donor_name, message, is_anonymous, created_at").eq("campaign_id", campaign.id).order("created_at", { ascending: false }).limit(20);
    return { campaign: campaign as Campaign, donations: donations ?? [] };
  });

