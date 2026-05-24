/**
 * Fulfillment Router — Layer 3 (Execution)
 *
 * Routes a confirmed Petri Bloom match to a provider adapter,
 * logs an immutable fulfillment_event, and updates the match's
 * execution status. STUB ADAPTERS ONLY — no real API calls yet.
 *
 * Idempotency: each (match_id, action) generates a deterministic
 * idempotency_key. Re-running returns the prior event instead of
 * creating a duplicate.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type Provider = "wolt" | "uber" | "uber_travel" | "none";
export type ExecutionStatus = "executed" | "failed" | "skipped";

export type MatchInput = {
  id: string;
  category?: string | null;
  score?: number | null;
  confidence_score?: number | null;
  help_request_id?: string | null;
  sponsor_id?: string | null;
};

export type RouterResult = {
  match_id: string;
  provider: Provider;
  status: ExecutionStatus;
  cost: number;
  currency: string;
  reason: string;
  event_id: string | null;
  idempotency_key: string;
};

function pickProvider(category?: string | null): Provider {
  // Normalize slugs ("elderly-care", "food_delivery") and free text alike
  // by collapsing to a single lowercase token stream.
  const c = (category ?? "").toLowerCase().replace(/[_-]+/g, " ").trim();
  if (!c) return "none";
  // Explicit slug map first — keeps the routing predictable for known categories.
  const SLUG_MAP: Record<string, Provider> = {
    "food": "wolt",
    "food delivery": "wolt",
    "groceries": "wolt",
    "meals": "wolt",
    "elderly care": "wolt",        // delivered meals to elders
    "medical supplies": "wolt",
    "transport": "uber",
    "transportation": "uber",
    "mobility": "uber",
    "rides": "uber",
    "medical transport": "uber",
    "travel": "uber_travel",
    "lodging": "uber_travel",
    "housing": "uber_travel",
  };
  if (c in SLUG_MAP) return SLUG_MAP[c];
  if (/(food|meal|grocery|restaurant|elder|hunger|nutrition)/.test(c)) return "wolt";
  if (/(travel|flight|stay|hotel|trip|lodg|housing)/.test(c)) return "uber_travel";
  if (/(transport|ride|taxi|mobility|car|commute)/.test(c)) return "uber";
  return "none";
}

/** Stub adapters — replace with real API integrations later. */
const adapters: Record<Provider, (m: MatchInput) => Promise<{ cost: number; currency: string; reference: string }>> = {
  wolt: async (m) => ({ cost: 22.5, currency: "USD", reference: `wolt_stub_${m.id.slice(0, 8)}` }),
  uber: async (m) => ({ cost: 18.0, currency: "USD", reference: `uber_stub_${m.id.slice(0, 8)}` }),
  uber_travel: async (m) => ({ cost: 240.0, currency: "USD", reference: `ubertravel_stub_${m.id.slice(0, 8)}` }),
  none: async () => ({ cost: 0, currency: "USD", reference: "noop" }),
};

export async function routeMatchToFulfillment(match: MatchInput): Promise<RouterResult> {
  const provider = pickProvider(match.category);
  const idempotency_key = `match:${match.id}:execute:v1`;

  // Idempotency check — return prior event if it exists.
  const existing = await supabaseAdmin
    .from("fulfillment_events")
    .select("id, provider, status, cost, currency, response")
    .eq("idempotency_key", idempotency_key)
    .maybeSingle();

  if (existing.data) {
    return {
      match_id: match.id,
      provider: (existing.data.provider as Provider) ?? provider,
      status: (existing.data.status as ExecutionStatus) ?? "executed",
      cost: Number(existing.data.cost ?? 0),
      currency: existing.data.currency ?? "USD",
      reason: "idempotent_replay",
      event_id: existing.data.id,
      idempotency_key,
    };
  }

  let status: ExecutionStatus = "executed";
  let cost = 0;
  let currency = "USD";
  let response: Record<string, unknown> = {};
  let reason = "stub_executed";

  if (provider === "none") {
    status = "skipped";
    reason = "no_provider_for_category";
  } else {
    try {
      const out = await adapters[provider](match);
      cost = out.cost;
      currency = out.currency;
      response = { reference: out.reference, stub: true };
    } catch (err) {
      status = "failed";
      reason = err instanceof Error ? err.message : "adapter_error";
      response = { error: reason };
    }
  }

  const inserted = await supabaseAdmin
    .from("fulfillment_events")
    .insert({
      match_id: match.id,
      sponsorship_id: null,
      event_type: "match_executed",
      provider,
      status,
      cost,
      currency,
      idempotency_key,
      response: JSON.parse(JSON.stringify(response)),
      notes: reason,
    })
    .select("id")
    .single();

  // Update match with last execution outcome.
  await supabaseAdmin
    .from("petri_matches")
    .update({
      execution_status: status,
      provider,
      cost,
      currency,
      category: match.category ?? null,
      last_executed_at: new Date().toISOString(),
    })
    .eq("id", match.id);

  return {
    match_id: match.id,
    provider,
    status,
    cost,
    currency,
    reason,
    event_id: inserted.data?.id ?? null,
    idempotency_key,
  };
}

