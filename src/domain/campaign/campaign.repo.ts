import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Campaign } from "./campaign.types";

export async function getByHandle(handle: string) {
  const { data, error } = await supabaseAdmin
    .from("campaigns")
    .select("*")
    .eq("handle", handle)
    .maybeSingle();

  if (error || !data) return null;

  return data as Campaign;
}

export async function list() {
  const { data, error } = await supabaseAdmin
    .from("campaigns")
    .select("*");

  if (error) return [];

  return (data ?? []) as Campaign[];
}

export async function listByCategory(slug: string) {
  const [{ data: category, error: catErr }, { data: campaigns, error: campErr }] =
    await Promise.all([
      supabaseAdmin
        .from("categories")
        .select("*")
        .eq("slug", slug)
        .maybeSingle(),

      supabaseAdmin
        .from("campaigns")
        .select("*")
        .eq("category_slug", slug),
    ]);

  return {
    category: catErr ? null : category,
    campaigns: campErr ? [] : ((campaigns ?? []) as Campaign[]),
  };
}
