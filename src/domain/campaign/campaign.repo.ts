import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { Campaign } from "./campaign.model";

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
  const { data } = await supabaseAdmin.from("campaigns").select("*");
  return (data ?? []) as Campaign[];
}

export async function listByCategory(slug: string) {
  const [{ data: category }, { data: campaigns }] = await Promise.all([
    supabaseAdmin.from("categories").select("*").eq("slug", slug).maybeSingle(),
    supabaseAdmin.from("campaigns").select("*").eq("category_slug", slug),
  ]);

  return {
    category,
    campaigns: (campaigns ?? []) as Campaign[],
  };
}
