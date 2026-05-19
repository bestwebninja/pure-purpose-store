export type SponsorshipStatus =
  | "draft"
  | "available"
  | "matched"
  | "active"
  | "completed";

export type ReintegrationPillar = {
  shelter: {
    label: "7 NIGHTS OF SAFE SHELTER";
    description: string;
  };
  nutrition: {
    label: "DAILY NUTRITIOUS MEALS (3X)";
    description: string;
  };
  counseling: {
    label: "1-on-1 TRANSITION COUNSELING";
    description: string;
  };
};

export type SponsorshipPackage = {
  id: string;

  blessing_id: string; // person being supported

  title: string; // "Veteran Stability Master Platform"

  price: number; // 500

  currency: string;

  status: SponsorshipStatus;

  pillars: ReintegrationPillar;

  fulfillment_score: number;

  created_at?: string;
};
