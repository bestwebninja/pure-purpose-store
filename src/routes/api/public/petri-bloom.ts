import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * PETRI BLOOM ARCHITECTURE (v3)
 *
 * Layer 1 — Data Ingestion (Raw Signals)
 *   requests, intents, location, budget, category_ids
 *
 * Layer 2 — Matching Intelligence (Petri Bloom Core)
 *   weighted similarity scoring, feedback-decayed multipliers,
 *   confidence_score, status: auto_match | pending_review | none
 *
 * Layer 3 — Real-world Execution (Impact Layer)
 *   confirmed matches, human review outcomes, real-world activation
 *
 * This system converts human intent into structured impact flows.
 */

type Loc = { zip?: string | null; city?: string | null; country?: string | null };
type Payload = {
  source_id?: string | null;
  source_type?: "intent" | "request" | string;
  location?: Loc;
  category_ids?: string[];
  budget?: number | null;
  // Optional candidate to score against. If omitted, engine just records the token.
  candidate?: {
    id?: string | null;
    location?: Loc;
    category_ids?: string[];
    budget?: number | null;
  } | null;
};

const MAX_BODY_BYTES = 8 * 1024;        // 8KB cap — defends against payload spam
const MAX_CATEGORY_IDS = 16;            // bounds engine + storage cost per call

/**
 * Authorize a petri-bloom request. Accepts either:
 *   - A valid Supabase session (bearer token in Authorization header), OR
 *   - A valid HMAC-SHA256 signature in `x-petri-signature` over the raw body
 *     using PETRI_WEBHOOK_SECRET.
 * Returns null on success, or a Response on rejection.
 */
async function authorizePetriRequest(request: Request, raw: string): Promise<Response | null> {
  // 1. HMAC signature path (server-to-server, cron, trusted callers)
  const sig = request.headers.get("x-petri-signature");
  const secret = process.env.PETRI_WEBHOOK_SECRET;
  if (sig && secret) {
    const expected = createHmac("sha256", secret).update(raw, "utf8").digest("hex");
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length === b.length && timingSafeEqual(a, b)) return null;
    return new Response(JSON.stringify({ error: "invalid_signature" }), {
      status: 401, headers: { "Content-Type": "application/json" },
    });
  }

  // 2. Authenticated user path (app calls)
  const auth = request.headers.get("authorization") ?? "";
  if (auth.toLowerCase().startsWith("bearer ")) {
    const token = auth.slice(7);
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (url && key) {
      try {
        const c = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
        const { data, error } = await c.auth.getUser(token);
        if (!error && data.user) return null;
      } catch (e) {
        console.error("[petri-bloom] auth verify failed", e);
      }
    }
  }

  return new Response(JSON.stringify({ error: "unauthorized" }), {
    status: 401, headers: { "Content-Type": "application/json" },
  });
}

function scoreLocation(a?: Loc, b?: Loc): number {
  if (!a || !b) return 0;
  if (a.zip && b.zip && a.zip.trim().toLowerCase() === b.zip.trim().toLowerCase()) return 100;
  if (a.city && b.city && a.city.trim().toLowerCase() === b.city.trim().toLowerCase()) return 70;
  if (a.country && b.country && a.country.trim().toLowerCase() === b.country.trim().toLowerCase()) return 40;
  return 0;
}

function scoreCategory(a: string[] = [], b: string[] = []): number {
  if (!a.length || !b.length) return 0;
  const setB = new Set(b);
  if (a.some((c) => setB.has(c))) return 100;
  // "related" heuristic placeholder — overlap any prefix (e.g. parent)
  if (a.some((c) => b.some((d) => d.startsWith(c.slice(0, 8))))) return 60;
  return 0;
}

function scoreBudget(a?: number | null, b?: number | null): number {
  if (a == null || b == null || a <= 0 || b <= 0) return 0;
  const ratio = Math.min(a, b) / Math.max(a, b);
  return ratio >= 0.6 ? 100 : 0;
}

function statusFor(score: number): "auto_match" | "pending_review" | "none" {
  if (score >= 180) return "auto_match";
  if (score >= 120) return "pending_review";
  return "none";
}

/**
 * Time-decayed feedback weighting.
 * Recent ratings count more (3-day exponential decay). Output is
 * tightly bounded to prevent runaway drift in either direction.
 */
async function getFeedbackMultipliers(): Promise<{ loc: number; cat: number; bud: number }> {
  try {
    const { data } = await supabaseAdmin
      .from("petri_feedback")
      .select("rating, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    const now = Date.now();
    const weighted = (data ?? []).map((r: { rating: number; created_at: string }) => {
      const ageHours = (now - new Date(r.created_at).getTime()) / 36e5;
      const decay = Math.exp(-ageHours / 72); // 3-day decay
      return (r.rating ?? 0) * decay;
    });
    const sum = weighted.reduce((a, b) => a + b, 0);
    const norm = Math.max(-20, Math.min(20, sum)) / 100;
    return {
      loc: Math.max(0.9, Math.min(1.1, 1 + Math.max(0, norm) * 0.4)),
      cat: Math.max(0.85, Math.min(1.1, 1 + Math.min(0, norm) * 0.6)),
      bud: Math.max(0.9, Math.min(1.1, 1 + Math.max(0, norm) * 0.4)),
    };
  } catch {
    return { loc: 1, cat: 1, bud: 1 };
  }
}

export const Route = createFileRoute("/api/public/petri-bloom")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Petri Bloom operates as a lightweight matching intelligence layer.
        // Only high-confidence matches are persisted to avoid dataset pollution.
        // This system prioritizes meaningful human connections over volume.
        const raw = await request.text();
        if (raw.length > MAX_BODY_BYTES) {
          return new Response(JSON.stringify({ error: "payload_too_large" }), {
            status: 413, headers: { "Content-Type": "application/json" },
          });
        }
        const denied = await authorizePetriRequest(request, raw);
        if (denied) return denied;

        let payload: Payload;
        try {
          payload = JSON.parse(raw) as Payload;
        } catch {
          return new Response(JSON.stringify({ error: "invalid_json" }), {
            status: 400, headers: { "Content-Type": "application/json" },
          });
        }
        if (Array.isArray(payload.category_ids) && payload.category_ids.length > MAX_CATEGORY_IDS) {
          payload.category_ids = payload.category_ids.slice(0, MAX_CATEGORY_IDS);
        }
        if (payload.candidate?.category_ids && payload.candidate.category_ids.length > MAX_CATEGORY_IDS) {
          payload.candidate.category_ids = payload.candidate.category_ids.slice(0, MAX_CATEGORY_IDS);
        }

        const cand = payload.candidate ?? null;
        const w = await getFeedbackMultipliers();
        const locS = cand ? scoreLocation(payload.location, cand.location) * w.loc : 0;
        const catS = cand ? scoreCategory(payload.category_ids, cand.category_ids) * w.cat : 0;
        const budS = cand ? scoreBudget(payload.budget, cand.budget) * w.bud : 0;
        const rawScore = locS + catS + budS;
        const score = Math.round(rawScore);
        const status = statusFor(score);
        const confidence_score = Math.min(1, Math.max(0, score / 300));
        const breakdown = {
          location_score: Math.round(locS),
          category_score: Math.round(catS),
          budget_score: Math.round(budS),
          feedback_multipliers: w,
          confidence_score,
          final_decision_reason:
            status === "auto_match"
              ? "Strong overall similarity across location, category, and budget."
              : status === "pending_review"
                ? "Partial match — flagged for human review."
                : "Insufficient signal overlap to qualify as a match.",
        };
        const message =
          status === "auto_match"
            ? "Strong match found."
            : status === "pending_review"
              ? "Possible match — needs review."
              : "No qualifying match yet.";

        // Non-blocking persistence; ignore errors so the engine never breaks callers.
        try {
          await supabaseAdmin.from("petri_tokens").insert({
            type: "intent",
            source_id: payload.source_id ?? null,
            payload: JSON.parse(JSON.stringify({ ...payload, breakdown })),
            score,
            status,
            confidence_score,
            match_generation: "v3",
          });
          if (
            cand &&
            (status === "auto_match" ||
              (status === "pending_review" && score >= 150 && confidence_score > 0.65))
          ) {
            await supabaseAdmin.from("petri_matches").insert({
              help_request_id: payload.source_type === "request" ? payload.source_id ?? null : null,
              sponsor_id: payload.source_type === "intent" ? payload.source_id ?? null : null,
              score,
              status: status === "auto_match" ? "confirmed" : "pending",
              confidence_score,
              match_generation: "v3",
            });
          }
        } catch (e) {
          console.error("[petri-bloom] persist failed", e);
        }

        return Response.json({
          score,
          status,
          message,
          confidence_score,
          match_generation: "v3",
          breakdown,
        });
      },
    },
  },
});

