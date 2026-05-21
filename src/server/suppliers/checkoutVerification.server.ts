import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type CheckoutVerification = {
  fulfillable: boolean;
  supplierCount: number;
  zip: string;
};

/**
 * Pre-checkout verification for sponsor → blessee stabilization fulfillment.
 *
 * Checks (in order):
 *  1. ZIP is active in zip_supply_index
 *  2. At least one accommodation supplier in that ZIP is status=active
 *  3. That supplier has available_rooms > 0
 *  4. Therefore sponsor fulfillment is possible right now
 */
export async function verifyFulfillmentBeforeCheckout(
  zip: string
): Promise<CheckoutVerification> {
  const normalized = zip.trim();
  if (!normalized) {
    return { fulfillable: false, supplierCount: 0, zip: normalized };
  }

  const { data: zipRow, error: zipErr } = await supabaseAdmin
    .from("zip_supply_index" as any)
    .select("has_accommodation, active_supplier_count")
    .eq("zip", normalized)
    .maybeSingle();
  if (zipErr) throw new Error(zipErr.message);

  const zipActive =
    !!(zipRow as any)?.has_accommodation &&
    Number((zipRow as any)?.active_supplier_count ?? 0) > 0;
  if (!zipActive) {
    return { fulfillable: false, supplierCount: 0, zip: normalized };
  }

  const { data: suppliers, error: supErr } = await supabaseAdmin
    .from("accommodation_suppliers" as any)
    .select("id, available_rooms, status")
    .eq("zip", normalized)
    .eq("status", "active")
    .gt("available_rooms", 0);
  if (supErr) throw new Error(supErr.message);

  const supplierCount = (suppliers ?? []).length;
  return {
    fulfillable: supplierCount > 0,
    supplierCount,
    zip: normalized,
  };
}