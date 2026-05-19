import type { AccommodationSupplier } from "../accommodationSupplier.types";

export function calculateNightlyRate(supplier: AccommodationSupplier) {
  const base = supplier.pricing.base_nightly_rate_usd;

  const demandMultiplier = supplier.capacity.available_rooms < 3 ? 1.3 : 1.0;

  const trustBonus = supplier.verification.trust_score > 80 ? 0.95 : 1.0;

  const petriAdjustment = supplier.integration.booking_api_connected ? 1.05 : 0.9;

  return Math.round(base * demandMultiplier * trustBonus * petriAdjustment);
}
