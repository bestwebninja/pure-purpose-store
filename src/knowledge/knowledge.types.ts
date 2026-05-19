import type { Campaign } from "@/domain/campaign";

export type KnowledgeQuery =
  | "active_blessings"
  | "blessing_by_handle"
  | "funding_velocity";

export type ActiveBlessingsResult = {
  items: Campaign[];
};

export type BlessingByHandleResult = {
  item: Campaign | null;
};

export type FundingVelocityResult = {
  total_raised: number;
  total_goal: number;
  active_count: number;
};
