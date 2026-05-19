import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type RealtimeCampaign = {
  id: string;
  raised_amount: number;
  donor_count: number;
  goal_amount: number;
};

export type RealtimeDonation = {
  id: string;
  campaign_id: string | null;
  amount: number;
  currency: string;
  donor_name: string | null;
  message: string | null;
  is_anonymous: boolean;
  created_at: string;
};

/**
 * Subscribes to campaign + donation updates for a single blessing.
 */
export function useCampaignRealtime<C extends RealtimeCampaign>(initial: C, initialDonations: RealtimeDonation[] = []) {
  const [campaign, setCampaign] = useState<C>(initial);
  const [donations, setDonations] = useState<RealtimeDonation[]>(initialDonations);

  useEffect(() => {
    setCampaign(initial);
    setDonations(initialDonations);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial.id]);

  useEffect(() => {
    const channel = supabase
      .channel(`campaign:${initial.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "campaigns", filter: `id=eq.${initial.id}` },
        (payload) => {
          setCampaign((prev) => ({ ...prev, ...(payload.new as Partial<C>) }));
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "donations", filter: `campaign_id=eq.${initial.id}` },
        (payload) => {
          setDonations((prev) => [payload.new as RealtimeDonation, ...prev].slice(0, 50));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [initial.id]);

  return { campaign, donations };
}

/**
 * Subscribes to all campaign updates (for grids).
 */
export function useCampaignsRealtime<C extends RealtimeCampaign>(initial: C[]) {
  const [campaigns, setCampaigns] = useState<C[]>(initial);

  useEffect(() => {
    setCampaigns(initial);
  }, [initial]);

  useEffect(() => {
    const channel = supabase
      .channel("campaigns:all")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "campaigns" },
        (payload) => {
          setCampaigns((prev) =>
            prev.map((c) => (c.id === (payload.new as C).id ? { ...c, ...(payload.new as C) } : c)),
          );
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return campaigns;
}

