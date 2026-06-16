import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const getPublicStats = createServerFn({ method: "GET" }).handler(async () => {
  const [campaignsRes, donationsRes] = await Promise.all([
    supabaseAdmin.from("campaigns").select("id, raised_amount, donor_count, status"),
    supabaseAdmin.from("donations").select("id, amount, currency, donor_email, is_anonymous"),
  ]);
  const campaigns = campaignsRes.data ?? [];
  const donations = donationsRes.data ?? [];
  const totalRaised = donations.reduce((s, d) => s + Number(d.amount ?? 0), 0);
  const uniqueDonors = new Set(
    donations
      .filter((d) => !d.is_anonymous && d.donor_email)
      .map((d) => (d.donor_email as string).toLowerCase())
  ).size;
  return {
    campaignsActive: campaigns.filter((c) => c.status === "active").length,
    campaignsTotal: campaigns.length,
    totalRaised,
    donationsCount: donations.length,
    uniqueDonors,
    currency: "USD",
  };
});
