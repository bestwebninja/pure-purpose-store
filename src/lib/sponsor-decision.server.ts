/**
 * SponsorDecisionAI — server-only logic.
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

import { supabaseAdmin } from "@/integrations/supabase/client.server";

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-3-flash-preview";
const CANDIDATE_POOL_SIZE = 12;

export type RecommendationSource = "petri_match" | "campaign";

export type SponsorRecommendation = {
  id: string;
  source: RecommendationSource;
  title: string;
  category: string | null;
  amount: number | null;
  currency: string;
  score: number; // 0–100, AI confidence
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
      title: m.category ? `Match · ${m.category}` : `Match ${m.id.slice(0, 8)}`,
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
      summary: `${c.short_description ?? ""} · location=${c.location ?? "n/a"} · raised=${c.raised_amount}/${c.goal_amount}`.slice(0, 280),
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