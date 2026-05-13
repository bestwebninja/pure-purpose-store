import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * STUB: Blog generator. Wire to Lovable AI Gateway in a follow-up.
 * Today this returns a deterministic placeholder so the lifecycle
 * "Story Published" stage can be exercised end-to-end.
 */
export const generateBlessingStory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ campaignId: z.string().uuid(), tone: z.enum(["warm", "factual", "celebratory"]).default("warm") }).parse(input),
  )
  .handler(async ({ data }) => {
    // TODO: call Lovable AI Gateway (google/gemini-2.5-flash) to draft the story
    // and persist to a `blessing_stories` table once schema is added.
    return {
      ok: true,
      stub: true,
      campaignId: data.campaignId,
      title: "A blessing delivered",
      body: `[STUB ${data.tone} story for campaign ${data.campaignId}]`,
    };
  });