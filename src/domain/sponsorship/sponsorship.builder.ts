import type { Blessing } from "@/domain/blessing/blessing.model";

export function buildSponsorshipPackage(blessing: Blessing) {
  return {
    id: crypto.randomUUID(),

    blessing_id: blessing.id,

    title: "Veteran Stability Master Platform",

    price: 500,

    currency: blessing.currency,

    status: "available",

    pillars: {
      shelter: {
        label: "7 NIGHTS OF SAFE SHELTER",
        description: "Secure, clean accommodation (Apt 4B)",
      },
      nutrition: {
        label: "DAILY NUTRITIOUS MEALS (3X)",
        description: "Pure vegetarian & vegan meal plan",
      },
      counseling: {
        label: "1-on-1 TRANSITION COUNSELING",
        description: "Career + life reintegration support",
      },
    },

    fulfillment_score: 0,
  };
}
