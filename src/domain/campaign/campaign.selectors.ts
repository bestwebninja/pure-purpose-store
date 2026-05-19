import type { Campaign } from "./campaign.types";

export const campaignProgress = (c: Campaign) =>
  c.goal_amount > 0
    ? Math.round((c.raised_amount / c.goal_amount) * 100)
    : 0;

export const isFunded = (c: Campaign) =>
  c.goal_amount > 0 && c.raised_amount >= c.goal_amount;
