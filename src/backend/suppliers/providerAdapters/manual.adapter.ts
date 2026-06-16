import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { SupplierProviderAdapter, NormalizedSupplierRecord } from "./types";

/**
 * Manual adapter — real Supabase-backed supplier records.
 * Reads accommodation_suppliers rows that were entered by ops/admin and
 * normalizes them into the shared shape so the sync engine treats every
 * provider identically.
 */
export const manualAdapter: SupplierProviderAdapter = {
  provider: "manual",
  async syncSupplierAvailability(): Promise<NormalizedSupplierRecord[]> {
    const { data, error } = await supabaseAdmin
      .from("accommodation_suppliers" as any)
      .select(
        "id, zip, available_rooms, base_nightly_rate_usd, status"
      );

    if (error) throw new Error(error.message);

    return ((data ?? []) as any[]).map((r) => ({
      supplierId: r.id as string,
      zip: String(r.zip ?? "").trim(),
      available_rooms: Number(r.available_rooms ?? 0),
      nightly_rate_usd: Number(r.base_nightly_rate_usd ?? 0),
      active: r.status === "active" && Number(r.available_rooms ?? 0) > 0,
    }));
  },
};
