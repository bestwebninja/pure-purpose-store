import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// =============================================================================
// Admin-only demo data seeder.
//
// Every record inserted carries is_demo = true so it can be cleared without
// touching real production rows. Idempotent: seedDemoData() clears the prior
// demo set first, then re-inserts a fresh deterministic batch.
// =============================================================================

const TARGETS = {
  ngos: 25,
  sponsors: 50,
  campaigns: 30,
  cases: 100,
  petriTokens: 150,
  petriMatches: 250,
  donations: 500,
  fulfillmentEvents: 200,
  impactReports: 40,
} as const;

async function assertAdmin(userId: string) {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden: admin role required");
}

function pick<T>(arr: readonly T[], i: number): T {
  return arr[i % arr.length];
}

function uuid(): string {
  return crypto.randomUUID();
}

function pastDate(daysAgo: number): string {
  return new Date(Date.now() - daysAgo * 86_400_000).toISOString();
}

const FIRST = ["Aria","Liam","Noah","Maya","Ravi","Sofia","Kai","Zara","Ethan","Mira","Jonah","Anya","Theo","Nadia","Owen","Iris","Leo","Asha","Felix","Priya","Sam","Yuki","Mateo","Lena","Ravi","Tomas","Hana","Jules","Nora","Beau"];
const LAST  = ["Okafor","Patel","Nguyen","Silva","Khan","Müller","Tanaka","Garcia","Rossi","Cohen","Larsen","Diaz","Singh","Bauer","Adeyemi","Park","Costa","Hassan","Vega","Yamamoto"];
const CITIES = ["Lagos","Mumbai","Hanoi","Lisbon","Karachi","Berlin","Tokyo","Bogotá","Milan","Tel Aviv","Oslo","Mexico City","Bengaluru","Vienna","Nairobi","Seoul","São Paulo","Cairo","Lima","Osaka"];
const COUNTRIES = ["NG","IN","VN","PT","PK","DE","JP","CO","IT","IL","NO","MX","IN","AT","KE","KR","BR","EG","PE","JP"];
const CATEGORIES = ["medical","food","education","childcare","employment","utilities","clothing","accommodation","travel","other"];
const PRIORITIES = ["LOW","NORMAL","HIGH","CRITICAL"];
const CASE_STATUSES = ["DRAFT","APPROVED","OPEN","FUNDED"];
const NGO_CAUSES = [["education"],["health","child welfare"],["food security"],["disaster relief"],["housing"],["gender equality"],["mental health"],["clean water"]];
const SPONSOR_ROLES = ["INDIVIDUAL","CORPORATE","FOUNDATION"];
const PROVIDERS = ["manual","airbnb","booking","instacart","amazon"];
const FE_STATUSES = ["pending","succeeded","delivered","fulfilled","failed"];

export const clearDemoData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const tables = [
      "fulfillment_events",
      "impact_reports",
      "donations",
      "petri_matches",
      "petri_scorecards",
      "petri_tokens",
      "cases",
      "campaigns",
      "sponsors",
      "ngo_applications",
    ];
    const deleted: Record<string, number> = {};
    for (const t of tables) {
      if (t === "petri_scorecards") {
        // No is_demo column; clear by joining via token_id of demo tokens.
        const { data: tokenRows } = await supabaseAdmin.from("petri_tokens").select("id").eq("is_demo", true);
        const ids = (tokenRows ?? []).map((r) => r.id);
        if (ids.length) {
          const { count } = await supabaseAdmin.from("petri_scorecards").delete({ count: "exact" }).in("token_id", ids);
          deleted[t] = count ?? 0;
        } else {
          deleted[t] = 0;
        }
        continue;
      }
      const { count, error } = await supabaseAdmin.from(t).delete({ count: "exact" }).eq("is_demo", true);
      if (error) console.error("[seed.clear]", t, error.message);
      deleted[t] = count ?? 0;
    }
    return { ok: true, deleted };
  });

export const seedDemoData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const started = Date.now();

    // Wipe any prior demo batch first for clean idempotency.
    const cleanupTables = [
      "fulfillment_events","impact_reports","donations",
      "petri_matches","petri_tokens","cases","campaigns",
      "sponsors","ngo_applications",
    ];
    for (const t of cleanupTables) {
      await supabaseAdmin.from(t).delete().eq("is_demo", true);
    }

    const summary: Record<string, number> = {};

    // ── NGOs ────────────────────────────────────────────────────────────────
    const ngoRows = Array.from({ length: TARGETS.ngos }, (_, i) => ({
      name: `${pick(CITIES, i)} ${pick(["Care","Hope","Action","Foundation","Relief","Bridge","Light"], i)} ${i + 1}`,
      email: `ngo${i + 1}@demo.myblessings.dev`,
      ein: `DEMO-${String(100000 + i)}`,
      organization_type: pick(["NPO","NGO","CHARITY","FOUNDATION"], i),
      causes: pick(NGO_CAUSES, i) as string[],
      country: pick(COUNTRIES, i),
      geography: pick(CITIES, i),
      status: pick(["PENDING","APPROVED","APPROVED","PENDING","REJECTED"], i),
      intelligence_status: pick(["PENDING_REVIEW","CLEARED","CLEARED"], i),
      trust_score: 40 + (i * 7) % 60,
      is_demo: true,
    }));
    {
      const { data, error } = await supabaseAdmin.from("ngo_applications").insert(ngoRows).select("id");
      if (error) throw new Error(`ngo_applications: ${error.message}`);
      summary.ngos = data?.length ?? 0;
    }

    // ── Sponsors ────────────────────────────────────────────────────────────
    const sponsorRows = Array.from({ length: TARGETS.sponsors }, (_, i) => ({
      user_id: uuid(),
      sponsor_role: pick(SPONSOR_ROLES, i),
      organization_name: `${pick(FIRST, i)} ${pick(LAST, i)} ${pick(["Foundation","Capital","Group","Trust","Holdings","Fund"], i)}`,
      organization_details: "Demo sponsor seeded for investor preview.",
      city: pick(CITIES, i),
      state: pick(["CA","NY","TX","ON","BY","MH","KA","WA","FL","IL"], i),
      zip: String(10000 + i * 137).slice(0, 5),
      country: pick(COUNTRIES, i),
      help_interests: [pick(CATEGORIES, i), pick(CATEGORIES, i + 3)] as string[],
      verification_status: pick(["PENDING","APPROVED","APPROVED","APPROVED"], i),
      is_demo: true,
    }));
    const { data: sponsorIns, error: sponsorErr } = await supabaseAdmin
      .from("sponsors").insert(sponsorRows).select("id,user_id");
    if (sponsorErr) throw new Error(`sponsors: ${sponsorErr.message}`);
    const sponsorIds = (sponsorIns ?? []).map((r) => r.id);
    const sponsorUserIds = (sponsorIns ?? []).map((r) => r.user_id);
    summary.sponsors = sponsorIds.length;

    // ── Campaigns ───────────────────────────────────────────────────────────
    const campaignRows = Array.from({ length: TARGETS.campaigns }, (_, i) => {
      const goal = 500 + (i * 173) % 8000;
      const raised = Math.round(goal * (0.1 + (i % 9) / 10));
      return {
        handle: `demo-campaign-${i + 1}`,
        title: `${pick(["Help","Support","Stand With","A Hand for","Lift Up"], i)} ${pick(FIRST, i)} ${pick(LAST, i)}`,
        story: "A demo campaign seeded to demonstrate the marketplace flow.",
        short_description: `Demo campaign #${i + 1}`,
        beneficiary_name: `${pick(FIRST, i)} ${pick(LAST, i)}`,
        location: pick(CITIES, i),
        goal_amount: goal,
        raised_amount: raised,
        donor_count: Math.max(1, Math.round(raised / 75)),
        currency: "USD",
        status: pick(["active","active","active","completed"], i),
        featured: i % 7 === 0,
        category_slug: pick(CATEGORIES, i),
        is_demo: true,
      };
    });
    const { data: campIns, error: campErr } = await supabaseAdmin
      .from("campaigns").insert(campaignRows).select("id");
    if (campErr) throw new Error(`campaigns: ${campErr.message}`);
    const campaignIds = (campIns ?? []).map((r) => r.id);
    summary.campaigns = campaignIds.length;

    // ── Cases ───────────────────────────────────────────────────────────────
    const caseRows = Array.from({ length: TARGETS.cases }, (_, i) => ({
      recipient_user_id: uuid(),
      title: `${pick(["Urgent","Family","Education","Medical","Shelter","Food"], i)} need: ${pick(FIRST, i)} ${pick(LAST, i)}`,
      description: "Seeded demo case for investor preview.",
      target_amount: 200 + (i * 91) % 5000,
      currency: "USD",
      status: pick(CASE_STATUSES, i),
      priority: pick(PRIORITIES, i),
      city: pick(CITIES, i),
      country: pick(COUNTRIES, i),
      allocation_needs: [{ type: pick(CATEGORIES, i) }],
      is_demo: true,
    }));
    const { data: caseIns, error: caseErr } = await supabaseAdmin
      .from("cases").insert(caseRows).select("id,recipient_user_id");
    if (caseErr) throw new Error(`cases: ${caseErr.message}`);
    const caseIds = (caseIns ?? []).map((r) => r.id);
    summary.cases = caseIds.length;

    // ── Petri Tokens ────────────────────────────────────────────────────────
    const tokenRows = Array.from({ length: TARGETS.petriTokens }, (_, i) => ({
      type: pick(["help_request","sponsor_offer","match_candidate"], i),
      source_id: caseIds[i % caseIds.length],
      status: pick(["none","scored","matched","executed"], i),
      score: 30 + (i * 11) % 70,
      confidence_score: Math.round(((30 + (i * 7) % 70) / 100) * 100) / 100,
      feedback_score: Math.round(((i * 5) % 100) / 100 * 100) / 100,
      payload: { demo: true, idx: i },
      is_demo: true,
    }));
    const { data: tokenIns, error: tokenErr } = await supabaseAdmin
      .from("petri_tokens").insert(tokenRows).select("id");
    if (tokenErr) throw new Error(`petri_tokens: ${tokenErr.message}`);
    summary.petri_tokens = tokenIns?.length ?? 0;

    // ── Petri Matches ───────────────────────────────────────────────────────
    const matchRows = Array.from({ length: TARGETS.petriMatches }, (_, i) => ({
      help_request_id: caseIds[i % caseIds.length],
      sponsor_id: sponsorIds[i % sponsorIds.length],
      score: 40 + (i * 13) % 60,
      confidence_score: Math.round(((40 + (i * 9) % 60) / 100) * 100) / 100,
      status: pick(["pending","pending","approved","executed","confirmed","rejected"], i),
      execution_status: pick(["unfulfilled","unfulfilled","executed","executed","failed"], i),
      provider: pick(PROVIDERS, i),
      cost: 25 + (i * 17) % 800,
      currency: "USD",
      category: pick(CATEGORIES, i),
      is_demo: true,
    }));
    const { data: matchIns, error: matchErr } = await supabaseAdmin
      .from("petri_matches").insert(matchRows).select("id");
    if (matchErr) throw new Error(`petri_matches: ${matchErr.message}`);
    const matchIds = (matchIns ?? []).map((r) => r.id);
    summary.petri_matches = matchIds.length;

    // ── Donations ───────────────────────────────────────────────────────────
    const donationRows = Array.from({ length: TARGETS.donations }, (_, i) => ({
      campaign_id: campaignIds[i % campaignIds.length],
      shopify_order_id: `DEMO-ORD-${1000 + i}`,
      shopify_checkout_id: `DEMO-CHK-${1000 + i}`,
      amount: 5 + (i * 7) % 495,
      currency: "USD",
      donor_name: `${pick(FIRST, i)} ${pick(LAST, i)}`,
      donor_email: `donor${i}@demo.myblessings.dev`,
      message: i % 11 === 0 ? "Blessings on your journey." : null,
      is_anonymous: i % 13 === 0,
      created_at: pastDate(i % 180),
      is_demo: true,
    }));
    // Chunk donations: 500 in batches of 100.
    for (let i = 0; i < donationRows.length; i += 100) {
      const chunk = donationRows.slice(i, i + 100);
      const { error } = await supabaseAdmin.from("donations").insert(chunk);
      if (error) throw new Error(`donations chunk ${i}: ${error.message}`);
    }
    summary.donations = donationRows.length;

    // ── Fulfillment events ──────────────────────────────────────────────────
    const eventRows = Array.from({ length: TARGETS.fulfillmentEvents }, (_, i) => ({
      match_id: matchIds[i % matchIds.length],
      event_type: pick(["created","provider_called","status_update","completed"], i),
      provider: pick(PROVIDERS, i),
      status: pick(FE_STATUSES, i),
      cost: 10 + (i * 19) % 600,
      currency: "USD",
      notes: `demo event ${i + 1}`,
      created_at: pastDate(i % 90),
      is_demo: true,
    }));
    {
      const { error } = await supabaseAdmin.from("fulfillment_events").insert(eventRows);
      if (error) throw new Error(`fulfillment_events: ${error.message}`);
      summary.fulfillment_events = eventRows.length;
    }

    // ── Impact reports ──────────────────────────────────────────────────────
    const reportRows = Array.from({ length: TARGETS.impactReports }, (_, i) => ({
      sponsor_user_id: sponsorUserIds[i % sponsorUserIds.length],
      sponsor_id: sponsorIds[i % sponsorIds.length],
      summary: `Q${(i % 4) + 1} demo impact summary #${i + 1}: lives touched, families supported.`,
      package_total: 500 + (i * 211) % 9500,
      currency: "USD",
      package_signature: `demo-sig-${i + 1}`,
      status: pick(["draft","approved","sent","approved"], i),
      autonomy_level: i % 4,
      artifacts: { demo: true, idx: i },
      next_package: { suggested_total: 1000 + (i % 5) * 250 },
      created_at: pastDate(i % 120),
      is_demo: true,
    }));
    {
      const { error } = await supabaseAdmin.from("impact_reports").insert(reportRows);
      if (error) throw new Error(`impact_reports: ${error.message}`);
      summary.impact_reports = reportRows.length;
    }

    await supabaseAdmin.from("audit_logs").insert({
      actor_id: context.userId,
      action: "DEMO_SEED",
      entity_type: "system",
      metadata: { summary, duration_ms: Date.now() - started },
    });

    return { ok: true, summary, duration_ms: Date.now() - started };
  });

export const getDemoSeedStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const tables = [
      "ngo_applications","sponsors","campaigns","cases",
      "petri_tokens","petri_matches","donations",
      "fulfillment_events","impact_reports",
    ];
    const counts: Record<string, number> = {};
    for (const t of tables) {
      const { count } = await supabaseAdmin.from(t).select("id", { count: "exact", head: true }).eq("is_demo", true);
      counts[t] = count ?? 0;
    }
    return { counts };
  });