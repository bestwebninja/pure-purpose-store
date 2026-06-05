import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  providerAdapters,
  type NormalizedSupplierRecord,
} from "./providerAdapters";

export type SupplierSyncResult = {
  ran_at: string;
  suppliers_seen: number;
  zips_active: number;
  zips_deactivated: number;
  errors: string[];
};

/**
 * Cron-safe supplier sync.
 * - Pulls availability from every provider adapter.
 * - Updates accommodation_suppliers (active/inactive status + room counts).
 * - Recomputes zip_supply_index (has_accommodation + active_supplier_count).
 * - Deactivates ZIPs that no longer have any active inventory.
 * Designed to run every ~30 minutes.
 */
export async function runSupplierSync(): Promise<SupplierSyncResult> {
  const errors: string[] = [];
  const ranAt = new Date().toISOString();

  // 1. Pull from all providers in parallel.
  const settled = await Promise.allSettled(
    providerAdapters.map((a) => a.syncSupplierAvailability())
  );

  const records: NormalizedSupplierRecord[] = [];
  settled.forEach((r, i) => {
    if (r.status === "fulfilled") {
      records.push(...r.value);
    } else {
      errors.push(
        `${providerAdapters[i].provider}: ${r.reason instanceof Error ? r.reason.message : String(r.reason)}`
      );
    }
  });

  // 2. Upsert supplier inventory + activity status.
  for (const rec of records) {
    if (!rec.supplierId) continue;
    const { error } = await supabaseAdmin
      .from("accommodation_suppliers" as any)
      .update({
        available_rooms: rec.available_rooms,
        base_nightly_rate_usd: rec.nightly_rate_usd,
        status: rec.active ? "active" : "inactive",
        updated_at: new Date().toISOString(),
      })
      .eq("id", rec.supplierId);
    if (error) errors.push(`supplier ${rec.supplierId}: ${error.message}`);
  }

  // 3. Aggregate active inventory per ZIP from the canonical table.
  const { data: activeRows, error: aggErr } = await supabaseAdmin
    .from("accommodation_suppliers" as any)
    .select("zip, available_rooms, status");
  if (aggErr) {
    errors.push(`aggregate: ${aggErr.message}`);
    return {
      ran_at: ranAt,
      suppliers_seen: records.length,
      zips_active: 0,
      zips_deactivated: 0,
      errors,
    };
  }

  const zipCounts = new Map<string, number>();
  for (const r of (activeRows ?? []) as any[]) {
    const zip = String(r.zip ?? "").trim();
    if (!zip) continue;
    const isActive = r.status === "active" && Number(r.available_rooms ?? 0) > 0;
    if (isActive) zipCounts.set(zip, (zipCounts.get(zip) ?? 0) + 1);
    else if (!zipCounts.has(zip)) zipCounts.set(zip, 0);
  }

  // 4. Upsert each ZIP row.
  let zipsActive = 0;
  let zipsDeactivated = 0;
  for (const [zip, count] of zipCounts.entries()) {
    const has_accommodation = count > 0;
    if (has_accommodation) zipsActive++;
    else zipsDeactivated++;
    const { error } = await supabaseAdmin
      .from("zip_supply_index" as any)
      .upsert(
        {
          zip,
          has_accommodation,
          active_supplier_count: count,
          last_updated: new Date().toISOString(),
        },
        { onConflict: "zip" }
      );
    if (error) errors.push(`zip ${zip}: ${error.message}`);
  }

  return {
    ran_at: ranAt,
    suppliers_seen: records.length,
    zips_active: zipsActive,
    zips_deactivated: zipsDeactivated,
    errors,
  };
}

/**
 * Placeholder for short-lived inventory holds (sponsor checkout window).
 * No payment capture yet — will be wired once the hold table exists.
 */
export async function reserveInventoryWindow(_minutes = 15): Promise<{
  reserved: boolean;
  expires_at: string | null;
  reason: string;
}> {
  return {
    reserved: false,
    expires_at: null,
    reason: "inventory_hold_not_implemented",
  };
}