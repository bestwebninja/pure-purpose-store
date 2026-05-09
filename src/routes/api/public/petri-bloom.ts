import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Petri Bloom V2 is a real-time matching intelligence system that:
 * - converts human intent into structured graphs
 * - continuously improves match quality via feedback signals
 * - visualizes global kindness flow as an interactive network
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
 * Soft feedback weighting derived from prior petri_feedback entries.
 * Negative ratings dampen the category contribution; positive ratings
 * lightly amplify location + budget. Multipliers are bounded to avoid
 * runaway drift.
 */
async function getFeedbackMultipliers(): Promise<{ loc: number; cat: number; bud: number }> {
  try {
    const { data } = await supabaseAdmin
      .from("petri_feedback")
      .select("rating")
      .order("created_at", { ascending: false })
      .limit(100);
    const sum = (data ?? []).reduce((s, r: { rating: number }) => s + (r.rating ?? 0), 0);
    const norm = Math.max(-25, Math.min(25, sum)) / 100; // -0.25 .. +0.25
    return {
      loc: 1 + Math.max(0, norm) * 0.4, // up to +10%
      cat: 1 + Math.min(0, norm) * 0.6, // down to -15%
      bud: 1 + Math.max(0, norm) * 0.4, // up to +10%
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
        let payload: Payload;
        try {
          payload = (await request.json()) as Payload;
        } catch {
          return new Response(JSON.stringify({ error: "invalid_json" }), {
            status: 400, headers: { "Content-Type": "application/json" },
          });
        }

        const cand = payload.candidate ?? null;
        const w = await getFeedbackMultipliers();
        const rawScore = cand
          ? scoreLocation(payload.location, cand.location) * w.loc +
            scoreCategory(payload.category_ids, cand.category_ids) * w.cat +
            scoreBudget(payload.budget, cand.budget) * w.bud
          : 0;
        const score = Math.round(rawScore);
        const status = statusFor(score);
        const confidence_score = Math.min(1, Math.max(0, score / 300));
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
            payload: JSON.parse(JSON.stringify(payload)),
            score,
            status,
            confidence_score,
            match_generation: "v2",
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
              match_generation: "v2",
            });
          }
        } catch (e) {
          console.error("[petri-bloom] persist failed", e);
        }

        return Response.json({ score, status, message, confidence_score, match_generation: "v2" });
      },
    },
  },
});