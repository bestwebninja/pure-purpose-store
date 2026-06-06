import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type RecomputeResult = {
  ok: boolean;
  scanned: number;
  written: number;
  skipped: number;
  duration_ms: number;
  trigger: string;
  matching_autonomy: number;
  errors: string[];
};

type CaseRow = {
  id: string;
  status: string;
  priority: string;
  target_amount: number | string;
  created_at: string;
  category_id: string | null;
  country: string | null;
};

type TokenRow = {
  id: string;
  type: string;
  source_id: string | null;
  status: string;
  score: number;
  confidence_score: number | string;
  feedback_score: number | string;
  created_at: string;
};

type MatchRow = {
  help_request_id: string | null;
  confidence_score: number | string;
  status: string;
  execution_status: string;
};

type FulfillmentRow = {
  status: string | null;
  created_at: string;
};

const PRIORITY_WEIGHT: Record<string, number> = {
  CRITICAL: 100,
  HIGH: 80,
  NORMAL: 50,
  LOW: 25,
};

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

function urgencyScore(c: CaseRow | null): number {
  if (!c) return 30;
  const base = PRIORITY_WEIGHT[c.priority?.toUpperCase()] ?? 50;
  const ageDays = Math.max(0, (Date.now() - new Date(c.created_at).getTime()) / 86_400_000);
  // Up to +30 for cases sitting open for >= 30 days.
  const ageBoost = Math.min(30, ageDays);
  // OPEN/APPROVED stay urgent; FUNDED drops; DRAFT lower.
  const statusFactor =
    c.status === "OPEN" || c.status === "APPROVED" ? 1
    : c.status === "DRAFT" ? 0.45
    : c.status === "FUNDED" ? 0.2
    : 0.6;
  return clamp((base + ageBoost) * statusFactor);
}

function stabilityScore(c: CaseRow | null, recentEvents: FulfillmentRow[]): number {
  if (!c) return 50;
  // Stability rewards approved cases with low operational churn.
  const last7 = recentEvents.filter((e) => Date.now() - new Date(e.created_at).getTime() < 7 * 86_400_000);
  const failures = last7.filter((e) => (e.status ?? "").toLowerCase() === "failed").length;
  const churnPenalty = Math.min(40, failures * 12 + Math.max(0, last7.length - 6) * 4);
  const baseline = c.status === "APPROVED" || c.status === "FUNDED" ? 80 : c.status === "OPEN" ? 65 : 40;
  return clamp(baseline - churnPenalty);
}

function deliveryConfidence(token: TokenRow, events: FulfillmentRow[]): number {
  const tokenConf = clamp(Number(token.confidence_score ?? 0) * 100);
  if (events.length === 0) return clamp(tokenConf * 0.7 + 20);
  const success = events.filter((e) => {
    const s = (e.status ?? "").toLowerCase();
    return s === "succeeded" || s === "delivered" || s === "fulfilled" || s === "completed";
  }).length;
  const rate = success / events.length;
  return clamp(tokenConf * 0.5 + rate * 100 * 0.5);
}

function sponsorAlignment(matches: MatchRow[]): number {
  if (matches.length === 0) return 30;
  const avg = matches.reduce((s, m) => s + Number(m.confidence_score ?? 0), 0) / matches.length;
  const confirmed = matches.filter((m) => m.status === "confirmed" || m.execution_status === "fulfilled").length;
  return clamp(avg * 100 * 0.7 + (confirmed / matches.length) * 100 * 0.3);
}

function economicImpact(c: CaseRow | null): number {
  if (!c) return 20;
  const amount = Number(c.target_amount ?? 0);
  if (amount <= 0) return 15;
  // Log-scaled so $100 ≈ 25, $1k ≈ 45, $10k ≈ 65, $100k ≈ 85, $1M ≈ 100.
  const v = (Math.log10(amount) - 1) * 20 + 25;
  return clamp(v);
}

function decisionFor(composite: number, autonomy: number): "auto" | "queue" | "manual" {
  // 0 Manual · 1 Suggest · 2 Assisted · 3 Autonomous
  if (autonomy <= 0) return "manual";
  if (autonomy === 1) return composite >= 80 ? "queue" : "manual";
  if (autonomy === 2) return composite >= 75 ? "auto" : composite >= 55 ? "queue" : "manual";
  return composite >= 65 ? "auto" : composite >= 45 ? "queue" : "manual";
}

export async function recomputePetriScoresCore(opts: { limit: number; trigger: string }): Promise<RecomputeResult> {
  const started = Date.now();

  const { data: tokensData, error: tokensErr } = await supabaseAdmin
    .from("petri_tokens")
    .select("id,type,source_id,status,score,confidence_score,feedback_score,created_at")
    .order("created_at", { ascending: false })
    .limit(opts.limit);
  if (tokensErr) throw new Error(`Failed to load petri_tokens: ${tokensErr.message}`);
  const tokens = (tokensData ?? []) as TokenRow[];

  const caseIds = Array.from(new Set(tokens.map((t) => t.source_id).filter((x): x is string => !!x)));

  const [casesRes, matchesRes, eventsRes, autonomyRes] = await Promise.all([
    caseIds.length
      ? supabaseAdmin
          .from("cases")
          .select("id,status,priority,target_amount,created_at,category_id,country")
          .in("id", caseIds)
          .in("country", ["US", "IL"])
      : Promise.resolve({ data: [] as CaseRow[], error: null as null | { message: string } }),
    caseIds.length
      ? supabaseAdmin
          .from("petri_matches")
          .select("help_request_id,confidence_score,status,execution_status")
          .in("help_request_id", caseIds)
      : Promise.resolve({ data: [] as MatchRow[], error: null }),
    supabaseAdmin
      .from("fulfillment_events")
      .select("status,created_at,sponsorship_id")
      .order("created_at", { ascending: false })
      .limit(500),
    supabaseAdmin
      .from("system_modules")
      .select("autonomy_level,enabled")
      .eq("module_key", "matching")
      .is("country_code", null)
      .maybeSingle(),
  ]);

  if (casesRes.error) throw new Error(`Failed to load cases: ${casesRes.error.message}`);
  if (matchesRes.error) throw new Error(`Failed to load petri_matches: ${matchesRes.error.message}`);
  if (eventsRes.error) throw new Error(`Failed to load fulfillment_events: ${eventsRes.error.message}`);

  const caseMap = new Map<string, CaseRow>();
  for (const c of (casesRes.data ?? []) as CaseRow[]) caseMap.set(c.id, c);

  const matchesByCase = new Map<string, MatchRow[]>();
  for (const m of (matchesRes.data ?? []) as MatchRow[]) {
    if (!m.help_request_id) continue;
    const arr = matchesByCase.get(m.help_request_id) ?? [];
    arr.push(m);
    matchesByCase.set(m.help_request_id, arr);
  }

  const recentEvents = (eventsRes.data ?? []) as FulfillmentRow[];

  const matchingAutonomy = autonomyRes.data?.enabled === false ? 0 : Number(autonomyRes.data?.autonomy_level ?? 1);

  const rows = tokens.map((t) => {
    const c = t.source_id ? caseMap.get(t.source_id) ?? null : null;
    const matches = t.source_id ? matchesByCase.get(t.source_id) ?? [] : [];

    const urgency = urgencyScore(c);
    const stability = stabilityScore(c, recentEvents);
    const delivery = deliveryConfidence(t, recentEvents);
    const alignment = sponsorAlignment(matches);
    const impact = economicImpact(c);

    // Composite: weighted, normalised to 0–100.
    const composite = clamp(
      urgency * 0.30 +
        delivery * 0.22 +
        alignment * 0.18 +
        stability * 0.15 +
        impact * 0.15,
    );

    return {
      token_id: t.id,
      case_id: c?.id ?? null,
      urgency: Math.round(urgency * 100) / 100,
      stability: Math.round(stability * 100) / 100,
      delivery_confidence: Math.round(delivery * 100) / 100,
      sponsor_alignment: Math.round(alignment * 100) / 100,
      economic_impact: Math.round(impact * 100) / 100,
      composite_score: Math.round(composite * 100) / 100,
      autonomy_decision: decisionFor(composite, matchingAutonomy),
      inputs: {
        token: { status: t.status, type: t.type, confidence: Number(t.confidence_score) },
        case: c
          ? { status: c.status, priority: c.priority, amount: Number(c.target_amount) }
          : null,
        matches_count: matches.length,
        recent_events: recentEvents.length,
        matching_autonomy: matchingAutonomy,
      },
      last_computed_at: new Date().toISOString(),
    };
  });

  let written = 0;
  let skipped = 0;
  const chunkErrors: string[] = [];
  if (rows.length > 0) {
    // Upsert in chunks of 100 to stay well below request limits.
    for (let i = 0; i < rows.length; i += 100) {
      const chunk = rows.slice(i, i + 100);
      const { error } = await supabaseAdmin
        .from("petri_scorecards")
        .upsert(chunk, { onConflict: "token_id" });
      if (error) {
        console.error("[petri-recompute] upsert chunk failed", {
          chunkStart: i,
          chunkSize: chunk.length,
          error: error.message,
        });
        chunkErrors.push(`chunk@${i}: ${error.message}`);
        skipped += chunk.length;
      } else {
        written += chunk.length;
      }
    }
  }

  if (skipped > 0) {
    console.error("[petri-recompute] completed with skipped rows", {
      scanned: tokens.length,
      written,
      skipped,
      trigger: opts.trigger,
    });
  }

  return {
    ok: skipped === 0,
    scanned: tokens.length,
    written,
    skipped,
    duration_ms: Date.now() - started,
    trigger: opts.trigger,
    matching_autonomy: matchingAutonomy,
    errors: chunkErrors,
  };
}

