import { Campaign } from "./campaign.model";

export function isFunded(c: Campaign) {
  return c.goal_amount > 0 && c.raised_amount >= c.goal_amount;
}

export function fundingProgress(c: Campaign) {
  if (!c.goal_amount) return 0;
  return Math.min(100, (c.raised_amount / c.goal_amount) * 100);
}

export function isActive(c: Campaign) {
  return c.status === "active";
}
