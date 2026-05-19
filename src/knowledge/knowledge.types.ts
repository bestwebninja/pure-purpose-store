import type { Blessing } from "@/domain/blessing/blessing.model";

export type KnowledgeQuery =
  | "active_blessings"
  | "blessing_by_handle"
  | "funding_velocity";

export type ActiveBlessingsResult = {
  items: Blessing[];
};

export type BlessingByHandleResult = {
  item: Blessing | null;
};

export type FundingVelocityResult = {
  total_raised: number;
  total_goal: number;
  active_count: number;
};
