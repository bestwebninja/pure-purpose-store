/**
 * SponsorDecisionAI â€” server-only logic.
 *
 * Pulls the sponsor's preferences and history, gathers an unassigned candidate
 * pool from `petri_matches` and active `campaigns`, then asks Lovable AI to
 * rank the top three with a one-sentence reasoning string per pick.
 *
 * If the AI gateway is unreachable (no key, rate-limited, etc.) we fall back
 * to a deterministic heuristic so the dashboard never hangs.
 *
 * NOTE: This file is `.server.ts` and MUST NOT be imported from client code.
 * The client-callable wrapper lives in `sponsor-decision.functions.ts`.
 */

import { supabaseAdmin } from "../integrations/supabase/client.server";

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-3-flash-preview";
const CANDIDATE_POOL_SIZE = 12;
const PACKAGE_POOL_SIZE = 25;
const PACKAGE_MAX_ITEMS = 8;
const PACKAGE_MIN_ITEMS = 2;

export type RecommendationSource = "petri_match" | "campaign";

export type SponsorRecommendation = {
  id: string;
  source: RecommendationSource;
  title: string;
  category: string | null;
  amount: number | null;
  currency: string;
  score: number; // 0â€“100, AI confidence
  reasoning: string; // 1-sentence "AI Reasoning"
};

type Candidate = {
  id: string;
  source: RecommendationSource;
  title: string;
  category: string | null;
  amount: number | null;
  currency: string;
  /** Compact summary the LLM is allowed to read. */
  summary: string;
};

type SponsorContext = {
  sponsor_role: string | null;
  organization_name: string | null;
  help_interests: string[];
  past_categories: string[];
  past_donation_count: number;
};

/**
 * Build the recommendations for the given sponsor user id.
 */
export async function recommendForSponsor(userId: string): Promise<SponsorRecommendation[]> {
  const sponsorCtx = await loadSponsorContext(userId);
  const candidates = await loadCandidates();

  if (candidates.length === 0) return [];

  try {
    const ranked = await rankWithAI(sponsorCtx, candidates);
    if (ranked.length > 0) return ranked;
  } catch (err) {
    console.error("SponsorDecisionAI: AI gateway failed, falling back to heuristic", err);
  }

  return rankWithHeuristic(sponsorCtx, candidates);
}

// --------------------------------------------------------------------------
// Data loading
// --------------------------------------------------------------------------

async function loadSponsorContext(userId: string): Promise<SponsorContext> {
  const { data: sponsor } = await supabaseAdmin
    .from("sponsors")
    .select("sponsor_role, organization_name, help_interests")
    .eq("user_id", userId)
    .maybeSingle();

  const { data: pastSponsorships } = await supabaseAdmin
    .from("sponsorships")
    .select("blessing_id, case_id")
    .eq("sponsor_user_id", userId)
    .limit(50);

  // We don't have a direct join in Postgrest config (no FKs), so look up
  // categories the sponsor has actually funded in the past via blessings.
  const blessingIds = (pastSponsorships ?? [])
    .map((s) => s.blessing_id)
    .filter((v): v is string => typeof v === "string");

  let pastCategories: string[] = [];
  if (blessingIds.length > 0) {
    const { data: blessings } = await supabaseAdmin
      .from("blessings")
      .select("category_id")
      .in("id", blessingIds);
    const catIds = (blessings ?? [])
      .map((b) => b.category_id)
      .filter((v): v is string => typeof v === "string");
    if (catIds.length > 0) {
      const { data: cats } = await supabaseAdmin
        .from("assistance_categories")
        .select("name")
        .in("id", catIds);
      pastCategories = Array.from(new Set((cats ?? []).map((c) => c.name).filter(Boolean) as string[]));
    }
  }

  return {
    sponsor_role: sponsor?.sponsor_role ?? null,
    organization_name: sponsor?.organization_name ?? null,
    help_interests: (sponsor?.help_interests ?? []) as string[],
    past_categories: pastCategories,
    past_donation_count: pastSponsorships?.length ?? 0,
  };
}

async function loadCandidates(): Promise<Candidate[]> {
  const out: Candidate[] = [];

  // Unassigned petri matches
  const { data: matches } = await supabaseAdmin
    .from("petri_matches")
    .select("id, category, score, confidence_score, status, sponsor_id, cost, currency, execution_status")
    .is("sponsor_id", null)
    .eq("status", "pending")
    .order("confidence_score", { ascending: false })
    .limit(CANDIDATE_POOL_SIZE);

  for (const m of matches ?? []) {
    out.push({
      id: m.id,
      source: "petri_match",
      title: m.category ? `Match Â· ${m.category}` : `Match ${m.id.slice(0, 8)}`,
      category: m.category ?? null,
      amount: typeof m.cost === "string" ? Number(m.cost) : (m.cost ?? null),
      currency: m.currency ?? "USD",
      summary: `petri_match score=${m.score} confidence=${m.confidence_score} status=${m.execution_status}`,
    });
  }

  // Active campaigns
  const { data: campaigns } = await supabaseAdmin
    .from("campaigns")
    .select("id, title, short_description, category_slug, raised_amount, goal_amount, currency, location")
    .eq("status", "active")
    .order("featured", { ascending: false })
    .limit(CANDIDATE_POOL_SIZE);

  for (const c of campaigns ?? []) {
    const remaining = Math.max(0, Number(c.goal_amount ?? 0) - Number(c.raised_amount ?? 0));
    out.push({
      id: c.id,
      source: "campaign",
      title: c.title,
      category: c.category_slug ?? null,
      amount: remaining || Number(c.goal_amount ?? 0) || null,
      currency: c.currency ?? "USD",
      summary: `${c.short_description ?? ""} Â· location=${c.location ?? "n/a"} Â· raised=${c.raised_amount}/${c.goal_amount}`.slice(0, 280),
    });
  }

  return out;
}

// --------------------------------------------------------------------------
// AI ranking
// --------------------------------------------------------------------------

async function rankWithAI(
  ctx: SponsorContext,
  candidates: Candidate[],
): Promise<SponsorRecommendation[]> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

  const systemPrompt = [
    "You are SponsorDecisionAI, the matching engine for the MyBlessings giving platform.",
    "Pick the top 3 candidates from the provided pool that best fit the sponsor's stated",
    "interests, past giving history, and the candidate's own context. Reasoning must be",
    "ONE sentence, donor-facing, never reveal raw IDs.",
  ].join(" ");

  const userPayload = {
    sponsor: ctx,
    candidates: candidates.map((c) => ({
      id: c.id,
      source: c.source,
      title: c.title,
      category: c.category,
      amount: c.amount,
      currency: c.currency,
      summary: c.summary,
    })),
  };

  const body = {
    model: DEFAULT_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: JSON.stringify(userPayload) },
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "rank_candidates",
          description: "Return the top 3 ranked candidates with reasoning.",
          parameters: {
            type: "object",
            properties: {
              recommendations: {
                type: "array",
                minItems: 1,
                maxItems: 3,
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    score: { type: "number", minimum: 0, maximum: 100 },
                    reasoning: { type: "string", maxLength: 280 },
                  },
                  required: ["id", "score", "reasoning"],
                  additionalProperties: false,
                },
              },
            },
            required: ["recommendations"],
            additionalProperties: false,
          },
        },
      },
    ],
    tool_choice: { type: "function", function: { name: "rank_candidates" } },
  };

  const res = await fetch(AI_GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    if (res.status === 429) throw new Error("AI gateway rate limited");
    if (res.status === 402) throw new Error("AI gateway credits exhausted");
    throw new Error(`AI gateway error ${res.status}`);
  }

  const json = (await res.json()) as {
    choices?: Array<{
      message?: {
        tool_calls?: Array<{ function?: { arguments?: string } }>;
      };
    }>;
  };
  const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (!args) throw new Error("AI gateway returned no tool call");

  const parsed = JSON.parse(args) as {
    recommendations: Array<{ id: string; score: number; reasoning: string }>;
  };

  const byId = new Map(candidates.map((c) => [c.id, c]));
  return parsed.recommendations
    .map((r) => {
      const c = byId.get(r.id);
      if (!c) return null;
      return {
        id: c.id,
        source: c.source,
        title: c.title,
        category: c.category,
        amount: c.amount,
        currency: c.currency,
        score: Math.round(r.score),
        reasoning: r.reasoning,
      } satisfies SponsorRecommendation;
    })
    .filter((r): r is SponsorRecommendation => r !== null)
    .slice(0, 3);
}

// --------------------------------------------------------------------------
// Heuristic fallback (no AI)
// --------------------------------------------------------------------------

function rankWithHeuristic(ctx: SponsorContext, candidates: Candidate[]): SponsorRecommendation[] {
  const interestSet = new Set(
    [...ctx.help_interests, ...ctx.past_categories].map((s) => s.toLowerCase()),
  );
  const scored = candidates.map((c) => {
    let score = 40;
    if (c.category && interestSet.has(c.category.toLowerCase())) score += 40;
    if (c.source === "petri_match") score += 10;
    if ((c.amount ?? 0) > 0 && (c.amount ?? 0) < 500) score += 5;
    score = Math.min(95, score);
    const reasoning = c.category && interestSet.has(c.category.toLowerCase())
      ? `Aligns with your stated interest in ${c.category}.`
      : `A high-confidence opportunity in our active pool that fits sponsors like you.`;
    return {
      id: c.id,
      source: c.source,
      title: c.title,
      category: c.category,
      amount: c.amount,
      currency: c.currency,
      score,
      reasoning,
    } satisfies SponsorRecommendation;
  });
  return scored.sort((a, b) => b.score - a.score).slice(0, 3);
}

// ==========================================================================
// FUNDING PACKAGE (Sponsor Decision AI v2)
// ==========================================================================

export type FundingProfile = {
  sponsor_id: string;
  esg_goals: string[];
  industries: string[];
  geographies: string[];
  brand_values: string[];
  monthly_budget: number;
  currency: string;
};

export type FundingPackageItem = {
  scorecard_id: string;
  token_id: string;
  case_id: string | null;
  title: string;
  category: string | null;
  country: string | null;
  composite_score: number;
  autonomy_decision: string;
  /** Cents â€” exact integer allocation. */
  amount_cents: number;
  /** Decimal display amount (= amount_cents / 100). */
  amount: number;
  reasoning: string;
};

export type FundingPackage = {
  sponsor_user_id: string;
  currency: string;
  monthly_budget: number;
  /** Sum of items, equals monthly_budget exactly (zero rounding slop). */
  total: number;
  total_cents: number;
  items: FundingPackageItem[];
  generated_at: string;
  signature: string;
};

/**
 * Build the curated Funding Package for the given sponsor user id.
 * Items sum EXACTLY to the sponsor's monthly_budget (cents-precise).
 */
export async function buildFundingPackage(userId: string): Promise<FundingPackage> {
  const profile = await loadFundingProfile(userId);
  if (!profile) {
    throw new Error("No funding profile configured for this sponsor.");
  }
  if (!(profile.monthly_budget > 0)) {
    throw new Error("Sponsor monthly_budget must be greater than zero.");
  }

  const candidates = await loadScorecardCandidates();
  if (candidates.length === 0) {
    throw new Error("No active scorecards available â€” run Recompute first.");
  }

  // Score each candidate against the funding profile.
  const scored = candidates
    .map((c) => ({ candidate: c, fit: profileFit(profile, c) }))
    .sort((a, b) => b.fit - a.fit)
    .slice(0, PACKAGE_MAX_ITEMS)
    .filter((s) => s.fit > 0);

  const picks = scored.length >= PACKAGE_MIN_ITEMS
    ? scored
    : candidates
        .map((c) => ({ candidate: c, fit: Math.max(1, c.composite_score) }))
        .sort((a, b) => b.fit - a.fit)
        .slice(0, Math.max(PACKAGE_MIN_ITEMS, Math.min(PACKAGE_MAX_ITEMS, candidates.length)));

  // Allocate budget proportionally to fit, in cents, distributing remainder.
  const totalCents = Math.round(profile.monthly_budget * 100);
  const fitSum = picks.reduce((s, p) => s + p.fit, 0) || picks.length;
  const rawCents = picks.map((p) => (p.fit / fitSum) * totalCents);
  const floored = rawCents.map((v) => Math.floor(v));
  let allocated = floored.reduce((s, v) => s + v, 0);
  const remainders = rawCents
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);
  let cursor = 0;
  while (allocated < totalCents) {
    floored[remainders[cursor % remainders.length].i] += 1;
    allocated += 1;
    cursor += 1;
  }

  const items: FundingPackageItem[] = picks.map((p, idx) => {
    const cents = floored[idx];
    return {
      scorecard_id: p.candidate.scorecard_id,
      token_id: p.candidate.token_id,
      case_id: p.candidate.case_id,
      title: p.candidate.title,
      category: p.candidate.category,
      country: p.candidate.country,
      composite_score: p.candidate.composite_score,
      autonomy_decision: p.candidate.autonomy_decision,
      amount_cents: cents,
      amount: cents / 100,
      reasoning: reasoningFor(profile, p.candidate),
    };
  });

  // Final invariant check.
  const sumCents = items.reduce((s, it) => s + it.amount_cents, 0);
  if (sumCents !== totalCents) {
    throw new Error(`Funding package allocation drift: ${sumCents} != ${totalCents}`);
  }

  const generated_at = new Date().toISOString();
  const signature = await signPackage(userId, totalCents, items, generated_at);

  return {
    sponsor_user_id: userId,
    currency: profile.currency,
    monthly_budget: profile.monthly_budget,
    total: totalCents / 100,
    total_cents: totalCents,
    items,
    generated_at,
    signature,
  };
}

async function loadFundingProfile(userId: string): Promise<FundingProfile | null> {
  const { data: sponsor } = await supabaseAdmin
    .from("sponsors")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (!sponsor) return null;

  const { data: profile } = await supabaseAdmin
    .from("sponsor_funding_profiles")
    .select("sponsor_id, esg_goals, industries, geographies, brand_values, monthly_budget, currency")
    .eq("sponsor_id", sponsor.id)
    .maybeSingle();
  if (!profile) return null;

  return {
    sponsor_id: profile.sponsor_id,
    esg_goals: (profile.esg_goals ?? []) as string[],
    industries: (profile.industries ?? []) as string[],
    geographies: (profile.geographies ?? []) as string[],
    brand_values: (profile.brand_values ?? []) as string[],
    monthly_budget: Number(profile.monthly_budget ?? 0),
    currency: profile.currency ?? "USD",
  };
}

type ScorecardCandidate = {
  scorecard_id: string;
  token_id: string;
  case_id: string | null;
  composite_score: number;
  autonomy_decision: string;
  title: string;
  category: string | null;
  country: string | null;
};

async function loadScorecardCandidates(): Promise<ScorecardCandidate[]> {
  const { data: scorecards } = await supabaseAdmin
    .from("petri_scorecards")
    .select("id, token_id, case_id, composite_score, autonomy_decision")
    .order("composite_score", { ascending: false })
    .limit(PACKAGE_POOL_SIZE);

  const cards = scorecards ?? [];
  const caseIds = cards.map((c) => c.case_id).filter((v): v is string => typeof v === "string");
  let caseMap = new Map<string, { title: string; category_id: string | null; country: string | null }>();
  if (caseIds.length > 0) {
    const { data: cases } = await supabaseAdmin
      .from("cases")
      .select("id, title, category_id, country")
      .in("id", caseIds);
    caseMap = new Map(
      (cases ?? []).map((c) => [
        c.id,
        { title: c.title, category_id: c.category_id ?? null, country: c.country ?? null },
      ]),
    );
  }

  const categoryIds = Array.from(
    new Set(
      Array.from(caseMap.values())
        .map((c) => c.category_id)
        .filter((v): v is string => typeof v === "string"),
    ),
  );
  let categoryMap = new Map<string, string>();
  if (categoryIds.length > 0) {
    const { data: cats } = await supabaseAdmin
      .from("assistance_categories")
      .select("id, name")
      .in("id", categoryIds);
    categoryMap = new Map((cats ?? []).map((c) => [c.id, c.name]));
  }

  return cards.map((sc) => {
    const caseRow = sc.case_id ? caseMap.get(sc.case_id) : undefined;
    const category = caseRow?.category_id ? categoryMap.get(caseRow.category_id) ?? null : null;
    return {
      scorecard_id: sc.id,
      token_id: sc.token_id,
      case_id: sc.case_id ?? null,
      composite_score: Number(sc.composite_score ?? 0),
      autonomy_decision: sc.autonomy_decision ?? "manual",
      title: caseRow?.title ?? `Case ${sc.case_id?.slice(0, 8) ?? sc.token_id.slice(0, 8)}`,
      category,
      country: caseRow?.country ?? null,
    };
  });
}

function profileFit(profile: FundingProfile, c: ScorecardCandidate): number {
  let score = c.composite_score;
  const lower = (xs: string[]) => xs.map((s) => s.toLowerCase());
  const geos = lower(profile.geographies);
  const inds = lower(profile.industries);
  const esg = lower(profile.esg_goals);
  const brand = lower(profile.brand_values);

  if (c.country && geos.includes(c.country.toLowerCase())) score += 25;
  if (c.category) {
    const cat = c.category.toLowerCase();
    if (inds.includes(cat)) score += 20;
    if (esg.some((g) => cat.includes(g) || g.includes(cat))) score += 15;
    if (brand.some((b) => cat.includes(b) || b.includes(cat))) score += 10;
  }
  return Math.max(0, score);
}

function reasoningFor(profile: FundingProfile, c: ScorecardCandidate): string {
  const reasons: string[] = [];
  if (c.country && profile.geographies.map((g) => g.toLowerCase()).includes(c.country.toLowerCase())) {
    reasons.push(`matches your ${c.country} geography focus`);
  }
  if (c.category && profile.industries.map((i) => i.toLowerCase()).includes(c.category.toLowerCase())) {
    reasons.push(`aligns with your "${c.category}" industry priority`);
  }
  reasons.push(`PETRI composite score ${Math.round(c.composite_score)}`);
  return `Selected because it ${reasons.join(", ")}.`;
}

/**
 * Deterministic signature so the checkout layer can verify the package
 * the client submits is exactly the one we generated.
 */
async function signPackage(
  userId: string,
  totalCents: number,
  items: FundingPackageItem[],
  generatedAt: string,
): Promise<string> {
  const secret = process.env.PETRI_RECOMPUTE_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "fallback";
  const payload = JSON.stringify({
    u: userId,
    t: totalCents,
    g: generatedAt,
    i: items.map((it) => [it.scorecard_id, it.amount_cents]),
  });
  const { createHmac } = await import("crypto");
  return createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Re-derive the signature for a submitted package and assert it matches.
 * Used by checkout to enforce amount === package.total with zero slop.
 */
export async function verifyFundingPackage(
  userId: string,
  submitted: {
    total_cents: number;
    generated_at: string;
    items: Array<{ scorecard_id: string; amount_cents: number }>;
    signature: string;
  },
): Promise<void> {
  const sumCents = submitted.items.reduce((s, it) => s + it.amount_cents, 0);
  if (sumCents !== submitted.total_cents) {
    throw new Error("Package items do not sum to declared total.");
  }
  const secret = process.env.PETRI_RECOMPUTE_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "fallback";
  const payload = JSON.stringify({
    u: userId,
    t: submitted.total_cents,
    g: submitted.generated_at,
    i: submitted.items.map((it) => [it.scorecard_id, it.amount_cents]),
  });
  const { createHmac, timingSafeEqual } = await import("crypto");
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(submitted.signature, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new Error("Funding package signature invalid â€” package was tampered with.");
  }
}

