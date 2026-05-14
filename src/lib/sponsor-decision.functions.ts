import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { recommendForSponsor } from "./sponsor-decision.server";

/**
 * Client-callable wrapper around SponsorDecisionAI.
 * Always scoped to the authenticated sponsor — never accepts a user id from
 * the client.
 */
export const getSponsorRecommendations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const recommendations = await recommendForSponsor(context.userId);
    return { recommendations };
  });