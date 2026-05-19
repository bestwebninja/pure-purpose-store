import type { KnowledgeQuery } from "./knowledge.types";
import * as q from "./knowledge.queries";

export async function query(type: KnowledgeQuery, params?: any) {
  switch (type) {
    case "active_blessings":
      return {
        items: await q.getActiveBlessings(),
      };

    case "blessing_by_handle":
      return {
        item: await q.getBlessingByHandle(params.handle),
      };

    case "funding_velocity":
      return await q.getFundingVelocity();

    default:
      throw new Error(`Unknown knowledge query: ${type}`);
  }
}
