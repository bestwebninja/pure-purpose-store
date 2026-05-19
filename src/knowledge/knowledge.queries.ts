import { supabase } from "@/integrations/supabase/client";
import type { Campaign } from "@/domain/campaign";

export async function getActiveBlessings(): Promise<Campaign[]> {
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("status", "active");

  if (error) throw error;

  return (data ?? []) as Campaign[];
}

export async function getBlessingByHandle(handle: string): Promise<Campaign | null> {
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("handle", handle)
    .maybeSingle();

  if (error) throw error;

  return (data as Campaign) ?? null;
}

export async function getFundingVelocity() {
  const { data, error } = await supabase.from("campaigns").select("goal_amount, raised_amount, status");

  if (error) throw error;

  const rows = data ?? [];

  return {
    total_raised: rows.reduce((sum, r) => sum + (r.raised_amount ?? 0), 0),
    total_goal: rows.reduce((sum, r) => sum + (r.goal_amount ?? 0), 0),
    active_count: rows.filter((r) => r.status === "active").length,
  };
}
