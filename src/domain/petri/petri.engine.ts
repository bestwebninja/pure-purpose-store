import type {
  BlesseeProfile,
  PetriAllocationResult,
  PetriSupplierCandidate,
  SponsorIntent,
  DietaryType,
} from "./petri.types";

type EngineInput = {
  sponsor: SponsorIntent;
  blessees: BlesseeProfile[];
  suppliers: PetriSupplierCandidate[];
  zip: string;
};

function dietaryCompatible(
  need: DietaryType,
  s: PetriSupplierCandidate
): boolean {
  if (need === "any") return true;
  if (need === "vegan") return s.vegan_meal_available;
  return s.vegetarian_meal_available || s.vegan_meal_available;
}

function intentAlignment(
  intent: SponsorIntent,
  blessee: BlesseeProfile
): number {
  switch (intent.intent_type) {
    case "veteran_stabilization":
      return blessee.veteran_status ? 1 : 0.2;
    case "family_shelter":
      return blessee.stabilization_need.includes("shelter") ? 0.9 : 0.4;
    case "nutrition_only":
      return blessee.stabilization_need.includes("meals") ? 0.9 : 0.3;
    case "general_stabilization":
    default:
      return 0.7;
  }
}

/**
 * Deterministic scoring. Future ML hook: replace the weighted-sum below
 * with a model call; the input shape stays stable.
 */
export function calculatePetriAllocation(
  input: EngineInput
): PetriAllocationResult {
  const reasoning: string[] = [];
  const { sponsor, blessees, suppliers, zip } = input;

  const zipSuppliers = suppliers.filter(
    (s) => s.zip.trim() === zip.trim() && s.available_rooms > 0
  );
  if (zipSuppliers.length === 0) {
    reasoning.push("no_active_suppliers_in_zip");
    return {
      fulfillable: false,
      allocation_score: 0,
      matched_supplier_id: null,
      matched_blessee_id: null,
      zip,
      reasoning,
    };
  }

  const zipBlessees = blessees.filter(
    (b) => b.active_status && b.zip.trim() === zip.trim()
  );
  if (zipBlessees.length === 0) {
    reasoning.push("no_eligible_blessees_in_zip");
    return {
      fulfillable: false,
      allocation_score: 0,
      matched_supplier_id: null,
      matched_blessee_id: null,
      zip,
      reasoning,
    };
  }

  let bestScore = -1;
  let bestSupplier: PetriSupplierCandidate | null = null;
  let bestBlessee: BlesseeProfile | null = null;
  const localReasoning: string[] = [];

  for (const b of zipBlessees) {
    const compatible = zipSuppliers.filter((s) => dietaryCompatible(b.dietary_type, s));
    if (compatible.length === 0) continue;

    const alignment = intentAlignment(sponsor, b); // 0..1
    const urgency = Math.min(100, Math.max(0, b.urgency_score)) / 100;
    const trust = Math.min(100, Math.max(0, b.trust_score)) / 100;

    for (const s of compatible) {
      const supply = Math.min(1, s.available_rooms / 5); // 5 rooms ⇒ full supply
      const supplierTrust = Math.min(100, Math.max(0, s.trust_score)) / 100;
      const stabilizationProb = 0.4 * trust + 0.4 * supplierTrust + 0.2 * supply;

      const score =
        urgency * 30 +
        supply * 20 +
        alignment * 25 +
        stabilizationProb * 25;

      if (score > bestScore) {
        bestScore = score;
        bestSupplier = s;
        bestBlessee = b;
        localReasoning.length = 0;
        localReasoning.push(
          `urgency=${urgency.toFixed(2)}`,
          `supply=${supply.toFixed(2)}`,
          `alignment=${alignment.toFixed(2)}`,
          `stabilization_probability=${stabilizationProb.toFixed(2)}`,
          `dietary=${b.dietary_type}`
        );
      }
    }
  }

  if (!bestSupplier || !bestBlessee) {
    reasoning.push("no_dietary_compatible_pairing");
    return {
      fulfillable: false,
      allocation_score: 0,
      matched_supplier_id: null,
      matched_blessee_id: null,
      zip,
      reasoning,
    };
  }

  reasoning.push(...localReasoning);
  return {
    fulfillable: true,
    allocation_score: Math.round(bestScore),
    matched_supplier_id: bestSupplier.id,
    matched_blessee_id: bestBlessee.id,
    zip,
    reasoning,
  };
}