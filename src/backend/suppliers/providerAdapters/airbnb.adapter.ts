import type { SupplierProviderAdapter, NormalizedSupplierRecord } from "./types";

/**
 * Airbnb adapter — placeholder.
 * Future: read AIRBNB_API_KEY / AIRBNB_HOST_TOKEN from process.env and
 * call the Airbnb Partner API to pull host availability and pricing.
 */
export const airbnbAdapter: SupplierProviderAdapter = {
  provider: "airbnb",
  async syncSupplierAvailability(): Promise<NormalizedSupplierRecord[]> {
    const apiKey = process.env.AIRBNB_API_KEY;
    if (!apiKey) return [];
    // Placeholder — no live integration yet.
    return [];
  },
};
