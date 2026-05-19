import * as repo from "./campaign.repo";
import { Campaign } from "./campaign.model";

export async function getCampaign(handle: string) {
  return repo.getByHandle(handle);
}

export async function getCampaignWithDonations(handle: string) {
  const campaign = await repo.getByHandle(handle);
  if (!campaign) return null;

  const { data: donations } = await supabaseAdmin
    .from("donations")
    .select("id, amount, currency, donor_name, message, created_at")
    .eq("campaign_id", campaign.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return {
    campaign,
    donations: donations ?? [],
  };
}

export function calculateProgress(c: Campaign) {
  if (!c.goal_amount) return 0;
  return Math.min(100, Math.round((c.raised_amount / c.goal_amount) * 100));
}
