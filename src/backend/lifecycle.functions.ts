import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { isAllowedLocation, getAllowedCountries } from "@/lib/data-sovereignty";

export type LifecycleCounts = {
  requested: number;
  matched: number;
  funded: number;
  delivered: number;
  storyPublished: number;
  followupActive: number;
};

export const getLifecycleCounts = createServerFn({ method: "GET" }).handler(async (): Promise<LifecycleCounts> => {
  const [casesRes, matchesRes, donationsRes, fulfillmentRes, campaignsRes] = await Promise.all([
    supabaseAdmin.from("cases").select("id, status").in("country", getAllowedCountries() as unknown as string[]),
    supabaseAdmin.from("petri_matches").select("id, status, execution_status"),
    supabaseAdmin.from("donations").select("id"),
    supabaseAdmin.from("fulfillment_events").select("id, status, event_type"),
    supabaseAdmin.from("campaigns").select("id, status, raised_amount, goal_amount, story, location"),
  ]);
  const cases = casesRes.data ?? [];
  const matches = matchesRes.data ?? [];
  const donations = donationsRes.data ?? [];
  const fulfillment = fulfillmentRes.data ?? [];
  const campaigns = (campaignsRes.data ?? []).filter((c) => isAllowedLocation(c.location));

  return {
    requested: cases.length,
    matched: matches.filter((m) => m.status === "confirmed" || m.status === "pending").length,
    funded: donations.length + campaigns.filter((c) => Number(c.raised_amount) >= Number(c.goal_amount) && Number(c.goal_amount) > 0).length,
    delivered: fulfillment.filter((f) => f.status === "executed").length,
    storyPublished: campaigns.filter((c) => (c.story ?? "").trim().length > 0).length,
    followupActive: fulfillment.filter((f) => f.event_type === "followup_active").length,
  };
});

export const getMarketplaceFeed = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await supabaseAdmin
    .from("campaigns")
    .select("id, handle, title, image_url, short_description, location, donor_count, goal_amount, raised_amount, currency, status, category_slug")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(240);
  return { campaigns: (data ?? []).filter((c) => isAllowedLocation(c.location)).slice(0, 60) };
});

export const getImpactMapData = createServerFn({ method: "GET" }).handler(async () => {
  const { data: campaigns } = await supabaseAdmin
    .from("campaigns")
    .select("id, title, location, raised_amount, donor_count, status, category_slug")
    .order("raised_amount", { ascending: false })
    .limit(400);
  const allowed = (campaigns ?? []).filter((c) => isAllowedLocation(c.location));
  const byLocation = new Map<string, { location: string; raised: number; donors: number; count: number }>();
  for (const c of allowed) {
    const key = (c.location ?? "Unknown").trim() || "Unknown";
    const cur = byLocation.get(key) ?? { location: key, raised: 0, donors: 0, count: 0 };
    cur.raised += Number(c.raised_amount ?? 0);
    cur.donors += Number(c.donor_count ?? 0);
    cur.count += 1;
    byLocation.set(key, cur);
  }
  return { regions: Array.from(byLocation.values()).sort((a, b) => b.raised - a.raised) };
});

