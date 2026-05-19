import type { Campaign } from "./campaign.types";

export function toCampaign(raw: any): Campaign {
  return {
    id: raw.id,
    handle: raw.handle,
    title: raw.title,
    image_url: raw.image_url,
    short_description: raw.short_description,
    story: raw.story,
    location: raw.location,
    status: raw.status,
    currency: raw.currency,
    goal_amount: Number(raw.goal_amount),
    raised_amount: Number(raw.raised_amount),
    donor_count: Number(raw.donor_count ?? 0),
    shopify_variant_id: raw.shopify_variant_id ?? null,
  };
}
