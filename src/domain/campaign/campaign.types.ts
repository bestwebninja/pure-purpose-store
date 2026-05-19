export type CampaignStatus = "draft" | "active" | "paused" | "completed";

export type Campaign = {
  id: string;
  handle: string;
  title: string;

  short_description?: string | null;
  story?: string | null;

  status: CampaignStatus;

  goal_amount: number;
  raised_amount: number;
  donor_count: number;

  currency: string;

  image_url?: string | null;
  location?: string | null;

  shopify_variant_id?: string | null;

  created_at?: string | null;
  updated_at?: string | null;
};
