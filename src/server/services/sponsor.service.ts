import { supabaseAdmin as supabase } from "@/integrations/supabase/client.server";

// Sponsor Functions
export async function listSponsorInvoices(userId: string) {
  const { data, error } = await supabase
    .from("sponsor_invoices")
    .select("*")
    .eq("user_id", userId);

  if (error) throw error;
  return data;
}

export async function getSponsorRecommendations(userId: string) {
  return supabase.from("recommendations").select("*").eq("user_id", userId);
}

export async function updateSponsorStatus(id: string, status: string) {
  return supabase.from("sponsors").update({ status }).eq("id", id);
}