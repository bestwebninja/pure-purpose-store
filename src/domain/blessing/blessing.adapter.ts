import type { Campaign } from "@/domain/campaign";
import type { Blessing } from "./blessing.model";

export function campaignToBlessing(c: Campaign): Blessing {
  const status =
    c.status === "paused" ? "active" : (c.status ?? "active");
  return {
    id: c.id,
    title: c.title,
    story: c.story ?? null,
    category: null,

    goal_amount: c.goal_amount,
    raised_amount: c.raised_amount,
    currency: c.currency,

    status,

    image_url: c.image_url ?? null,
    location: c.location ?? null,

    person_id: "",
    created_at: c.created_at ?? undefined,
    updated_at: c.updated_at ?? undefined,
  };
}
