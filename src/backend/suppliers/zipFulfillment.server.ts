import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type ZipFulfillmentStatus = {
  zip: string;
  active: boolean;
  supplier_count: number;
};

export async function isZipFulfillable(zip: string): Promise<ZipFulfillmentStatus> {
  const normalized = zip.trim();

  const { data, error } = await supabaseAdmin
    .from("zip_supply_index" as any)
    .select("zip, has_accommodation, active_supplier_count")
    .eq("zip", normalized)
    .maybeSingle();

  if (error) {
    console.error("[suppliers.isZipFulfillable] zip_supply_index query failed", { zip: normalized, error: error.message });
    throw new Error(`ZIP fulfillment check failed: ${error.message}`);
  }

  const row = data as
    | { zip: string; has_accommodation: boolean | null; active_supplier_count: number | null }
    | null;

  const supplierCount = row?.active_supplier_count ?? 0;
  const active = !!row?.has_accommodation && supplierCount > 0;

  return {
    zip: normalized,
    active,
    supplier_count: supplierCount,
  };
}

export type ActiveSupplier = {
  id: string;
  name: string;
  type: string;
  country: string;
  city: string;
  zip: string;
  available_rooms: number;
  base_nightly_rate_usd: number;
  trust_score: number | null;
};

export async function getActiveSuppliersByZip(zip: string): Promise<ActiveSupplier[]> {
  const normalized = zip.trim();

  const { data, error } = await supabaseAdmin
    .from("accommodation_suppliers" as any)
    .select(
      "id, name, type, country, city, zip, available_rooms, base_nightly_rate_usd, trust_score, status"
    )
    .eq("zip", normalized)
    .eq("status", "active")
    .gt("available_rooms", 0);

  if (error) {
    console.error("[suppliers.getActiveSuppliersByZip] accommodation_suppliers query failed", { zip: normalized, error: error.message });
    throw new Error(`Active supplier lookup failed: ${error.message}`);
  }

  return ((data ?? []) as any[]).map((r) => ({
    id: r.id,
    name: r.name,
    type: r.type,
    country: r.country,
    city: r.city,
    zip: r.zip,
    available_rooms: r.available_rooms,
    base_nightly_rate_usd: Number(r.base_nightly_rate_usd),
    trust_score: r.trust_score,
  }));
}
