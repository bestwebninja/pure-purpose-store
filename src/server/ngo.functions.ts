import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "../integrations/supabase/auth-middleware";
import { supabaseAdmin } from "../integrations/supabase/client.server";
import type { VettingMatrixEntry } from "../integrations/supabase/types.ngo";

const SIMILARITY_PASS = 0.85;
const SIMILARITY_FLAG = 0.5;

const SubmitSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  ein: z.string().regex(/^\d{2}-\d{7}$/, "Format must be XX-XXXXXXX"),
  organization_type: z.string().min(1),
  country: z.string().trim().min(2).max(80),
  causes: z.array(z.string().min(1).max(60)).min(1).max(10),
  geography: z.string().trim().min(2).max(120),
});

function editDistance(s1: string, s2: string): number {
  s1 = s1.toLowerCase().trim();
  s2 = s2.toLowerCase().trim();
  if (s1 === s2) return 0;
  const costs: number[] = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) costs[j] = j;
      else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1))
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

function calculateSimilarity(s1: string, s2: string): number {
  // Normalize by removing common suffixes that skew distance results for NGOs
  const normalize = (s: string) => s.toLowerCase().replace(/\b(inc|llc|corp|foundation|charity|nfp|org|the)\b/g, "").trim();
  const n1 = normalize(s1);
  const n2 = normalize(s2);
  const longer = n1.length > n2.length ? n1 : n2;
  const shorter = n1.length > n2.length ? n2 : n1;
  if (longer.length === 0) return 1.0;
  return (longer.length - editDistance(n1, n2)) / longer.length;
}

async function runIntelligenceCheck(input: { name: string; email: string }) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) {
    console.warn("[ngo.runIntelligenceCheck] LOVABLE_API_KEY missing — using fallback score", { name: input.name });
    return { trust_score: 50, intelligence_status: "PENDING_REVIEW", error: "ai_key_missing" as const };
  }

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-1.5-flash",
        messages: [
          {
            role: "system",
            content: "You are an NGO compliance officer. Analyze the provided organization name and email. Return a JSON object with a 'trust_score' (0-100) and an 'analysis' (max 20 words). If the name appears to be a known high-impact charity, score high. If it looks suspicious or like a generic placeholder, score low.",
          },
          { role: "user", content: `Org: ${input.name}, Email: ${input.email}` },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`AI Gateway HTTP ${res.status}: ${body.slice(0, 200)}`);
    }

    const json = await res.json();
    const result = JSON.parse(json.choices[0].message.content);
    
    return {
      trust_score: Number(result.trust_score) || 60,
      intelligence_status: result.trust_score > 80 ? "AUTO_REVIEWED" : "PENDING_REVIEW",
      ai_reasoning: result.analysis,
    };
  } catch (err) {
    console.error("[ngo.runIntelligenceCheck] failed", { name: input.name, error: err instanceof Error ? err.message : String(err) });
    return { trust_score: 60, intelligence_status: "PENDING_REVIEW", error: "ai_failed" as const };
  }
}

export const submitNgoApplication = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SubmitSchema.parse(input))
  .handler(async ({ data }) => {
    // Idempotency: collapse rapid duplicate submissions of the same EIN+email
    // (form double-clicks, retries) into the same application row. Window: 10 minutes.
    const dupWindow = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: existingApp } = await supabaseAdmin
      .from("ngo_applications")
      .select("id, status, trust_score, intelligence_status")
      .eq("ein", data.ein)
      .eq("email", data.email)
      .gte("created_at", dupWindow)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existingApp) {
      return {
        id: (existingApp as any).id,
        trust_score: (existingApp as any).trust_score,
        intelligence_status: (existingApp as any).intelligence_status,
        deduplicated: true,
      };
    }

    // Automated Verification Matrix Logic (ProPublica Nonprofit Explorer API)
    const cleanEin = data.ein.replace(/\D/g, "");
    const proPublicaUrl = `https://projects.propublica.org/nonprofits/api/v2/organizations/${cleanEin}.json`;
    let vettingMatrix: VettingMatrixEntry[] = [];
    let autoStatus: "PENDING" | "ACTIVE" | "REJECTED" = "PENDING";

    try {
      const res = await fetch(proPublicaUrl);
      if (res.ok) {
        const json = await res.json();
        const org = json.organization;
        if (org) {
          const einMatch = org.ein === cleanEin;
          vettingMatrix.push({ point: "EIN Match", userInput: data.ein, proData: org.ein, status: einMatch ? "PASS" : "FAIL", action: einMatch ? "None" : "Verify EIN accuracy" });
          
          const sim = calculateSimilarity(data.name, org.name);
          const nameStatus = sim >= SIMILARITY_PASS ? "PASS" : (sim >= SIMILARITY_FLAG ? "FLAG" : "FAIL");
          vettingMatrix.push({ point: "Legal Name Match", userInput: data.name, proData: org.name, status: nameStatus, action: nameStatus === "PASS" ? "None" : "Check for DBA mismatch" });

          const sub = org.sub_section || "N/A";
          const subPass = sub.includes("3");
          vettingMatrix.push({ point: "Tax-Exempt Subsection", userInput: data.organization_type, proData: sub, status: subPass ? "PASS" : "FLAG", action: subPass ? "None" : "Confirm non-profit status" });

          const taxYear = org.tax_year ? parseInt(org.tax_year) : 0;
          const recent = taxYear >= (new Date().getFullYear() - 2);
          vettingMatrix.push({ point: "Filing Recency", userInput: "N/A", proData: taxYear ? `Year: ${taxYear}` : "No filing", status: recent ? "PASS" : "FLAG", action: recent ? "None" : "Request recent Form 990" });

          const revoked = !!org.revocation_date;
          vettingMatrix.push({ point: "Revocation Status", userInput: "N/A", proData: revoked ? `Revoked: ${org.revocation_date}` : "Active", status: revoked ? "FAIL" : "PASS", action: revoked ? "Manual review required" : "None" });

          vettingMatrix.push({ point: "Principal Officer", userInput: "N/A", proData: org.officer_name || "See latest 990", status: "PASS", action: "Identity verify officer" });

          const addr = `${org.address || ""}, ${org.city || ""}, ${org.state || ""} ${org.zipcode || ""}`;
          vettingMatrix.push({ point: "Principal Address", userInput: data.geography, proData: addr, status: "PASS", action: "Verify location" });

          const hasFail = vettingMatrix.some(m => m.status === "FAIL");
          const hasFlag = vettingMatrix.some(m => m.status === "FLAG");
          if (hasFail) autoStatus = "REJECTED";
          else if (!hasFlag) autoStatus = "ACTIVE";
          else autoStatus = "PENDING";
        } else {
          vettingMatrix.push({ point: "EIN Match", userInput: data.ein, proData: "NOT FOUND", status: "FAIL", action: "Verify EIN accuracy" });
          autoStatus = "REJECTED";
        }
      } else {
        vettingMatrix.push({ point: "Vetting Service", userInput: "N/A", proData: `HTTP ${res.status}`, status: "FLAG", action: "ProPublica API unreachable; manual verification required" });
      }
    } catch (err) {
      console.error("Vetting API error:", err);
      vettingMatrix.push({ point: "Vetting Service", userInput: "N/A", proData: "CONNECTION_ERROR", status: "FLAG", action: "External API error; check logs" });
    }

    const timestamp = new Date();
    const formattedTime = timestamp.toLocaleString('en-US', { timeZone: 'UTC' });
    
    const intel = await runIntelligenceCheck({ name: data.name, email: data.email });
    const { data: row, error } = await supabaseAdmin
      .from("ngo_applications" as any)
      .insert({
        name: data.name,
        email: data.email,
        ein: data.ein,
        organization_type: data.organization_type,
        country: data.country,
        causes: data.causes,
        geography: data.geography,
        status: autoStatus,
        trust_score: intel.trust_score,
        intelligence_status: intel.intelligence_status,
        ai_reasoning: intel.ai_reasoning,
      })
      .select("id")
      .single();
    if (error) {
      console.error("[ngo.submitNgoApplication] insert failed", { email: data.email, ein: data.ein, error: error.message });
      throw new Error(`Failed to submit NGO application: ${error.message}`);
    }
    const rowAny = row as any;

    // Edge-safe Digital Receipt Generation (Simulated)
    // In production, use a library like 'jspdf' (edge compatible) or an external PDF service.
    const receiptLabel = `www.myblessings.us NGO Application ${formattedTime}`;
    console.log(`[Receipt Generated]: ${receiptLabel}`);

    await supabaseAdmin.from("audit_logs").insert({
      action: "NGO_SUBMITTED",
      entity_type: "ngo_application",
      entity_id: rowAny.id,
      metadata: { 
        name: data.name, 
        email: data.email, 
        intel,
        receipt_label: receiptLabel,
        submitted_at: timestamp.toISOString(),
        vetting_matrix: vettingMatrix
      },
    });

    // Trigger applicant receipt email (Simulated)
    // Enqueue via your preferred provider (Postmark, Resend, etc.)
    console.log(`[Email Triggered]: Sending receipt to ${data.email}`);

    return { id: rowAny.id, ...intel };
  });

export const listNgoApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data: roleRow } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) throw new Error("Forbidden: admin role required");

    const { data, error } = await supabaseAdmin
      .from("ngo_applications")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { applications: data ?? [] };
  });

const UpdateStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["ACTIVE", "REJECTED", "PENDING"]),
});

export const updateNgoStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => UpdateStatusSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: roleRow } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) throw new Error("Forbidden: admin role required");

    const { error } = await supabaseAdmin
      .from("ngo_applications")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("audit_logs").insert({
      actor_id: userId,
      action: data.status === "ACTIVE" ? "NGO_APPROVED" : data.status === "REJECTED" ? "NGO_REJECTED" : "NGO_STATUS_CHANGED",
      entity_type: "ngo_application",
      entity_id: data.id,
      metadata: { status: data.status },
    });

    return { ok: true };
  });

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    return { isAdmin: !!data };
  });

export const listCategories = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return { categories: data ?? [] };
});

// ─── Admin Command Center: real ops snapshot ─────────────────────────────
export const getCommandCenterSnapshot = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data: roleRow } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) throw new Error("Forbidden: admin role required");

    const [
      donationsAgg,
      campaignsAgg,
      ngoAgg,
      webhookCount,
      ledgerEntries,
      recentDonations,
      recentWebhooks,
    ] = await Promise.all([
      supabaseAdmin.from("donations").select("sum:amount.sum(), count:id.count()").single() as unknown as Promise<{ data: { sum: number; count: number } | null; error: any }>,
      supabaseAdmin.from("campaigns").select("status") as unknown as Promise<{ data: Array<{ status: string }> | null; error: any }>,
      supabaseAdmin.from("ngo_applications").select("status") as unknown as Promise<{ data: Array<{ status: string }> | null; error: any }>,
      supabaseAdmin.from("webhook_events").select("*", { count: "exact", head: true }) as unknown as Promise<{ count: number | null; error: any; data: never[] }>,
      supabaseAdmin.from("ledger_entries").select("donation_id, side, amount") as unknown as Promise<{ data: Array<{ donation_id: string | null; side: string; amount: number }> | null; error: any }>,
      supabaseAdmin.from("donations").select("id, amount, currency, donor_name, created_at, campaign_id").order("created_at", { ascending: false }).limit(10) as unknown as Promise<{ data: Array<{ id: string; amount: number | string; currency: string; donor_name: string | null; created_at: string; campaign_id: string | null }> | null; error: any }>,
      supabaseAdmin.from("webhook_events").select("source, topic, event_id, processed_at").order("processed_at", { ascending: false }).limit(10) as unknown as Promise<{ data: Array<{ source: string; topic: string; event_id: string; processed_at: string }> | null; error: any }>,
    ]);

    // Surface partial query failures instead of silently returning empty arrays.
    const queryErrors: Record<string, string> = {};
    if (donationsAgg.error) queryErrors.donations = donationsAgg.error.message ?? String(donationsAgg.error);
    if (campaignsAgg.error) queryErrors.campaigns = campaignsAgg.error.message ?? String(campaignsAgg.error);
    if (ngoAgg.error) queryErrors.ngo = ngoAgg.error.message ?? String(ngoAgg.error);
    if (webhookCount.error) queryErrors.webhooks = webhookCount.error.message ?? String(webhookCount.error);
    if (ledgerEntries.error) queryErrors.ledger = ledgerEntries.error.message ?? String(ledgerEntries.error);
    if (recentDonations.error) queryErrors.recentDonations = recentDonations.error.message ?? String(recentDonations.error);
    if (recentWebhooks.error) queryErrors.recentWebhooks = recentWebhooks.error.message ?? String(recentWebhooks.error);
    if (Object.keys(queryErrors).length > 0) {
      console.error("[ngo.getCommandCenterSnapshot] partial query failures", queryErrors);
    }

    // Enforce explicit types on aggregate response
    const donationStats = donationsAgg.data as { sum: number; count: number } | null;
    const totalRaised = Number(donationStats?.sum ?? 0);
    const donationCount = Number(donationStats?.count ?? 0);

    // Campaign breakdown
    const campaignStatus: Record<string, number> = {};
    for (const c of campaignsAgg.data ?? []) campaignStatus[c.status] = (campaignStatus[c.status] ?? 0) + 1;

    // NGO breakdown
    const ngoStatus: Record<string, number> = {};
    for (const n of ngoAgg.data ?? []) ngoStatus[n.status] = (ngoStatus[n.status] ?? 0) + 1;

    // Ledger balance check (per donation: debits == credits). 
    // Optimization: Using a Map to aggregate in-memory is faster than individual queries, 
    // but should eventually be replaced by a database VIEW for zero-memory impact.
    const ledgerRows = (ledgerEntries.data ?? []) as Array<{ donation_id: string | null; side: string; amount: number }>;
    const ledgerTotals = new Map<string, { d: number; c: number }>();
    for (const e of ledgerRows) {
      const key = e.donation_id ?? "_null";
      const current = ledgerTotals.get(key) ?? { d: 0, c: 0 };
      const amt = Number(e.amount);
      if (e.side === "debit") current.d += amt;
      else current.c += amt;
      ledgerTotals.set(key, current);
    }

    const unbalanced = [...ledgerTotals.entries()].filter(([, t]) => Math.abs(t.d - t.c) > 0.001).map(([k]) => k);

    return {
      donations: {
        count: donationCount,
        totalRaised,
      },
      campaigns: {
        total: campaignsAgg.data?.length ?? 0,
        byStatus: campaignStatus,
      },
      ngo: {
        total: (ngoAgg.data ?? []).length,
        byStatus: ngoStatus,
      },
      pipeline: {
        webhookEventsSeen: webhookCount.count ?? 0,
        donationsRecorded: donationCount,
        shopifyWebhookSecretConfigured: !!process.env.SHOPIFY_WEBHOOK_SECRET,
      },
      ledger: {
        entries: ledgerEntries.data?.length ?? 0,
        donationsPosted: ledgerTotals.size,
        unbalancedCount: unbalanced.length,
        balanced: unbalanced.length === 0,
      },
      recent: {
        donations: (recentDonations.data ?? []) as Array<{ id: string; amount: number | string; currency: string; donor_name: string | null; created_at: string; campaign_id: string | null }>,
        webhooks: recentWebhooks.data ?? [],
      },
      generatedAt: new Date().toISOString(),
      errors: queryErrors,
    };
  });

