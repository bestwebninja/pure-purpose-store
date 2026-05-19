export type Campaign = {
  id: string;
  handle: string;
  title: string;

  image_url?: string | null;
  short_description?: string | null;
  story?: string | null;

  location?: string | null;
  status?: "draft" | "active" | "paused" | "completed";

  currency: string;
  goal_amount: number;
  raised_amount: number;

  donor_count: number;

  shopify_variant_id?: string | null;
};
