export type DietaryType =
  | "vegan"
  | "vegetarian"
  | "pure-veg"
  | "raw-organic"
  | "any";

export type StabilizationNeed =
  | "shelter"
  | "shelter+meals"
  | "shelter+meals+counseling"
  | "reintegration";

export type BlesseeProfile = {
  id: string;
  zip: string;
  veteran_status: boolean;
  urgency_score: number; // 0–100
  dietary_type: DietaryType;
  stabilization_need: StabilizationNeed;
  trust_score: number; // 0–100
  active_status: boolean;
};

export type SponsorIntentType =
  | "veteran_stabilization"
  | "family_shelter"
  | "nutrition_only"
  | "general_stabilization";

export type SponsorIntent = {
  sponsor_id: string;
  intent_type: SponsorIntentType;
  preferred_region: string; // zip or city
  funding_capacity: number; // USD
};

export type PetriAllocationResult = {
  fulfillable: boolean;
  allocation_score: number; // 0–100
  matched_supplier_id: string | null;
  matched_blessee_id: string | null;
  zip: string;
  reasoning: string[];
};

export type PetriSupplierCandidate = {
  id: string;
  zip: string;
  available_rooms: number;
  nightly_rate_usd: number;
  vegan_meal_available: boolean;
  vegetarian_meal_available: boolean;
  trust_score: number;
};
