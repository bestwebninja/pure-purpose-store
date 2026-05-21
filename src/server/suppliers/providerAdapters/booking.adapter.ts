import type { SupplierProviderAdapter, NormalizedSupplierRecord } from "./types";

/**
 * Booking.com adapter — placeholder.
 * Future: read BOOKING_API_KEY / BOOKING_PARTNER_ID from process.env and
 * call the Booking.com Connectivity / Demand API to pull live availability.
 */
export const bookingAdapter: SupplierProviderAdapter = {
  provider: "booking",
  async syncSupplierAvailability(): Promise<NormalizedSupplierRecord[]> {
    const apiKey = process.env.BOOKING_API_KEY;
    if (!apiKey) return [];
    // Placeholder — no live integration yet.
    return [];
  },
};