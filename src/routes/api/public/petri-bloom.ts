import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

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

export const Route = createFileRoute("/api/public/petri-bloom")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: Payload;
        try {
          payload = (await request.json()) as Payload;
        } catch {
          return new Response(JSON.stringify({ error: "invalid_json" }), {
            status: 400, headers: { "Content-Type": "application/json" },
          });
        }

        const cand = payload.candidate ?? null;
        const score = cand
          ? scoreLocation(payload.location, cand.location) +
            scoreCategory(payload.category_ids, cand.category_ids) +
            scoreBudget(payload.budget, cand.budget)
          : 0;
        const status = statusFor(score);
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
          });
          if (cand && status !== "none") {
            await supabaseAdmin.from("petri_matches").insert({
              help_request_id: payload.source_type === "request" ? payload.source_id ?? null : null,
              sponsor_id: payload.source_type === "intent" ? payload.source_id ?? null : null,
              score,
              status: "pending",
            });
          }
        } catch (e) {
          console.error("[petri-bloom] persist failed", e);
        }

        return Response.json({ score, status, message });
      },
    },
  },
});