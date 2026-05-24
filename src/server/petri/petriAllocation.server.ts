import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { verifyFulfillmentBeforeCheckout } from "@/server/api/gateway";
import { calculatePetriAllocation } from "@/domain/petri/petri.engine";
import type {
  BlesseeProfile,
  PetriAllocationResult,
  PetriSupplierCandidate,
  SponsorIntent,
} from "@/domain/petri/petri.types";

/**
 * Server-side stabilization allocation.
 * 1. Verifies ZIP fulfillment.
 * 2. Loads active suppliers in that ZIP.
 * 3. Loads eligible blessees in that ZIP.
 * 4. Runs Petri scoring and returns the best match.
 */
export async function allocateStabilizationSponsor(
  intent: SponsorIntent,
  zip: string
): Promise<PetriAllocationResult> {
  const normalizedZip = zip.trim();

  const verification: any = await verifyFulfillmentBeforeCheckout(normalizedZip);
  if (!verification.fulfillable) {
    return {
      fulfillable: false,
      allocation_score: 0,
      matched_supplier_id: null,
      matched_blessee_id: null,
      zip: normalizedZip,
      reasoning: ["zip_not_fulfillable"],
    };
  }

  const { data: supplierRows, error: supErr } = await supabaseAdmin
    .from("accommodation_suppliers" as any)
    .select(
      "id, zip, available_rooms, base_nightly_rate_usd, vegan_meal_available, vegetarian_meal_available, trust_score, status"
    )
    .eq("zip", normalizedZip)
    .eq("status", "active")
    .gt("available_rooms", 0);
  if (supErr) throw new Error(supErr.message);

  const suppliers: PetriSupplierCandidate[] = ((supplierRows ?? []) as any[]).map(
    (r) => ({
      id: r.id,
      zip: r.zip,
      available_rooms: Number(r.available_rooms ?? 0),
      nightly_rate_usd: Number(r.base_nightly_rate_usd ?? 0),
      vegan_meal_available: !!r.vegan_meal_available,
      vegetarian_meal_available: !!r.vegetarian_meal_available,
      trust_score: Number(r.trust_score ?? 0),
    })
  );

  const blessees = await loadEligibleBlessees(normalizedZip);

  return calculatePetriAllocation({
    sponsor: intent,
    blessees,
    suppliers,
    zip: normalizedZip,
  });
}

/**
 * Loads eligible blessee profiles for a ZIP. Sourced from `cases` rows that
 * are open for stabilization. Returns empty list if the projection cannot
 * be derived — keeps the engine deterministic.
 */
async function loadEligibleBlessees(zip: string): Promise<BlesseeProfile[]> {
  const { data, error } = await supabaseAdmin
    .from("cases")
    .select("id, postal_code, priority, status, allocation_needs")
    .eq("postal_code", zip)
    .in("status", ["APPROVED", "OPEN"]);

  if (error) return [];

  return ((data ?? []) as any[]).map((r) => {
    const needs: any[] = Array.isArray(r.allocation_needs) ? r.allocation_needs : [];
    const food = needs.find((n) => n?.type === "food");
    const dietary =
      food?.food_kind === "vegan"
        ? "vegan"
        : food?.food_kind === "pure-veg"
        ? "pure-veg"
        : food?.food_kind === "raw-organic"
        ? "raw-organic"
        : food
        ? "vegetarian"
        : "any";

    const hasMeals = needs.some((n) => n?.type === "food");
    const hasShelter = needs.some((n) => n?.type === "accommodation");
    const stabilization_need =
      hasShelter && hasMeals
        ? "shelter+meals"
        : hasShelter
        ? "shelter"
        : "reintegration";

    const urgency =
      r.priority === "URGENT" ? 95 : r.priority === "HIGH" ? 75 : 50;

    return {
      id: r.id as string,
      zip,
      veteran_status: false,
      urgency_score: urgency,
      dietary_type: dietary as BlesseeProfile["dietary_type"],
      stabilization_need: stabilization_need as BlesseeProfile["stabilization_need"],
      trust_score: 70,
      active_status: true,
    };
  });
}
