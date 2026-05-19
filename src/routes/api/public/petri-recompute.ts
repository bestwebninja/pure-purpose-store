import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";
import { recomputePetriScoresCore } from "@/server/petri-recompute.server";

const MAX_BODY_BYTES = 4 * 1024;

function verifySignature(raw: string, sig: string | null): boolean {
  const secret = process.env.PETRI_RECOMPUTE_SECRET;
  if (!secret || !sig) return false;
  const expected = createHmac("sha256", secret).update(raw, "utf8").digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export const Route = createFileRoute("/api/public/petri-recompute")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        if (raw.length > MAX_BODY_BYTES) {
          return new Response(JSON.stringify({ error: "payload_too_large" }), {
            status: 413,
            headers: { "Content-Type": "application/json" },
          });
        }
        const sig = request.headers.get("x-petri-signature");
        if (!verifySignature(raw, sig)) {
          return new Response(JSON.stringify({ error: "invalid_signature" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        let limit = 500;
        if (raw.trim().length) {
          try {
            const body = JSON.parse(raw) as { limit?: number };
            if (typeof body.limit === "number" && body.limit > 0 && body.limit <= 2000) {
              limit = Math.floor(body.limit);
            }
          } catch {
            return new Response(JSON.stringify({ error: "invalid_json" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }
        }

        try {
          const result = await recomputePetriScoresCore({ limit, trigger: "cron" });
          return Response.json(result);
        } catch (err) {
          console.error("[petri-recompute] failed", err);
          return new Response(
            JSON.stringify({ error: "recompute_failed", message: err instanceof Error ? err.message : "unknown" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});

