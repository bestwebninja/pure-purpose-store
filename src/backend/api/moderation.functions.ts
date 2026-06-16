import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Phase 2 — Image Trust Layer.
 *
 * Every user-submitted image goes through this gate before it can be linked
 * to a profile, sponsor record, case, or blessing. The model is asked to
 * decide three things, in priority order:
 *
 *   1. Is the image safe? (no nudity, gore, hate, weapons, illegal content)
 *   2. Is there a human in the frame, and are they smiling? 
 *      (MyBlessings rule: profile / case photos must show a smiling human.)
 *   3. Is the image clearly a real photo (not a screenshot, meme, or logo
 *      pasted as an avatar)?
 *
 * The verdict, the model's reasoning, and the raw payload are written to
 * `image_moderation_log` so admins can audit decisions.
 */

const ALLOWED_KINDS = [
  "avatar",
  "sponsor_logo",
  "case_photo",
  "blessing_photo",
  "other",
] as const;

const ModerateImageInput = z.object({
  /** Raw base64 (no data URL prefix) OR a data URL. */
  imageBase64: z.string().min(64).max(15_000_000),
  mimeType: z.string().regex(/^image\/(png|jpe?g|webp|gif)$/i),
  kind: z.enum(ALLOWED_KINDS),
  /** When true, reject images that don't show a smiling human. */
  requireSmilingHuman: z.boolean().default(false),
  /** Optional pointer to the entity this image will be attached to. */
  subject: z
    .object({
      kind: z.string().min(1).max(40),
      id: z.string().uuid(),
    })
    .optional(),
  /** Optional storage location, logged for forensic review. */
  bucket: z.string().max(120).optional(),
  path: z.string().max(512).optional(),
});

export type ModerationVerdict = {
  allow: boolean;
  verdict: "allow" | "reject" | "review";
  reason: string;
  smilingHuman: boolean | null;
  confidence: number | null;
  rule: string;
};

const MODEL = "google/gemini-2.5-flash";

function stripDataUrl(b64: string): string {
  const idx = b64.indexOf("base64,");
  return idx >= 0 ? b64.slice(idx + "base64,".length) : b64;
}

export const moderateImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ModerateImageInput.parse(input))
  .handler(async ({ data, context }): Promise<ModerationVerdict> => {
    const { userId } = context;
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Image moderation is not configured.");

    const cleanB64 = stripDataUrl(data.imageBase64);
    const dataUrl = `data:${data.mimeType};base64,${cleanB64}`;

    const systemPrompt =
      "You are MyBlessings' image trust gate. You judge whether an uploaded " +
      "image may be used on a humanitarian platform. Be strict on safety, " +
      "fair on identity. Never invent details you cannot see.";

    const userPrompt =
      `Image kind: ${data.kind}. ` +
      (data.requireSmilingHuman
        ? "Rule: a clearly visible, genuinely smiling human face MUST be present. "
        : "Rule: the image should be a respectful real photo or logo. ") +
      "Reject if the image contains: nudity, sexual content, gore, weapons, " +
      "hate symbols, illegal content, or any minors in unsafe situations. " +
      "Use the provided tool to record your decision.";

    const tool = {
      type: "function",
      function: {
        name: "record_image_verdict",
        description: "Record the image moderation decision.",
        parameters: {
          type: "object",
          properties: {
            allow: { type: "boolean", description: "True if the image is acceptable." },
            smiling_human: {
              type: "boolean",
              description: "True if a clearly visible human face is genuinely smiling.",
            },
            confidence: {
              type: "number",
              minimum: 0,
              maximum: 1,
              description: "Confidence in the verdict (0-1).",
            },
            reason: {
              type: "string",
              description: "Short, user-facing explanation (max 200 chars).",
            },
          },
          required: ["allow", "smiling_human", "confidence", "reason"],
          additionalProperties: false,
        },
      },
    } as const;

    let parsed: {
      allow: boolean;
      smiling_human: boolean;
      confidence: number;
      reason: string;
    } | null = null;
    let raw: unknown = null;
    let providerError: string | null = null;

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: [
                { type: "text", text: userPrompt },
                { type: "image_url", image_url: { url: dataUrl } },
              ],
            },
          ],
          tools: [tool],
          tool_choice: {
            type: "function",
            function: { name: "record_image_verdict" },
          },
        }),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        providerError = `gateway_${res.status}: ${body.slice(0, 200)}`;
      } else {
        raw = await res.json();
        const call =
          (raw as {
            choices?: Array<{
              message?: {
                tool_calls?: Array<{
                  function?: { name?: string; arguments?: string };
                }>;
              };
            }>;
          })?.choices?.[0]?.message?.tool_calls?.[0]?.function;

        if (call?.arguments) {
          try {
            parsed = JSON.parse(call.arguments);
          } catch {
            providerError = "Could not parse model verdict.";
          }
        } else {
          providerError = "Model returned no verdict.";
        }
      }
    } catch (err) {
      providerError = err instanceof Error ? err.message : "Unknown gateway error";
    }

    // Default to "review" (block, ask user to retry) when the provider fails,
    // so we never silently allow uncategorised content.
    let verdict: "allow" | "reject" | "review";
    let allow: boolean;
    let reason: string;
    let smilingHuman: boolean | null;
    let confidence: number | null;

    if (parsed) {
      smilingHuman = !!parsed.smiling_human;
      confidence = Number.isFinite(parsed.confidence) ? parsed.confidence : null;
      reason = (parsed.reason ?? "").slice(0, 240);
      const failsSmileRule = data.requireSmilingHuman && !smilingHuman;
      allow = parsed.allow && !failsSmileRule;
      verdict = allow ? "allow" : "reject";
      if (!allow && !reason) {
        reason = failsSmileRule
          ? "Smiling is a must ;-) { Please upload a Smiling Happy Photo }."
          : "This image does not meet our community safety or quality standards.";
      }
    } else {
      smilingHuman = null;
      confidence = null;
      reason = providerError ?? "Image could not be reviewed automatically.";
      verdict = "review";
      allow = false;
    }

    // Cleanly type the raw response for the audit log
    const rawResponse = (raw ?? { error: providerError }) as Record<string, unknown>;

    // Audit log via service role (bypasses RLS, never exposed to client).
    await supabaseAdmin
      .from("image_moderation_log")
      .insert({
        actor_user_id: userId,
        kind: data.kind,
        subject_kind: data.subject?.kind ?? null,
        subject_id: data.subject?.id ?? null,
        bucket: data.bucket ?? null,
        path: data.path ?? null,
        model: MODEL,
        verdict,
        reason,
        smiling_human: smilingHuman,
        confidence,
        raw_response: rawResponse,
      } as any)
      .then(() => undefined, () => undefined);

    return {
      allow,
      verdict,
      reason,
      smilingHuman,
      confidence,
      rule: data.requireSmilingHuman
        ? "Smiling human face required."
        : "Safe, respectful imagery only.",
    };
  });
