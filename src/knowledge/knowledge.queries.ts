import { supabase } from "@/integrations/supabase/client";
import type { Blessing } from "@/domain/blessing/blessing.model";
import { campaignToBlessing } from "@/domain/blessing/blessing.adapter";

export async function getActiveBlessings(): Promise<Blessing[]> {
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("status", "active");

  if (error) throw error;

  return (data ?? []).map(campaignToBlessing);
}

export async function getBlessingByHandle(handle: string): Promise<Blessing | null> {
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("handle", handle)
    .maybeSingle();

  if (error) throw error;

  return data ? campaignToBlessing(data) : null;
}

export async function getFundingVelocity() {
  const { data, error } = await supabase
    .from("campaigns")
    .select("goal_amount, raised_amount, status");

  if (error) throw error;

  const rows = data ?? [];

  return {
    total_raised: rows.reduce((sum, r) => sum + (r.raised_amount ?? 0), 0),
    total_goal: rows.reduce((sum, r) => sum + (r.goal_amount ?? 0), 0),
    active_count: rows.filter((r) => r.status === "active").length,
  };
}
