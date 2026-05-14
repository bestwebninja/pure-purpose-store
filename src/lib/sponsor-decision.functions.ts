import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { buildFundingPackage, recommendForSponsor } from "./sponsor-decision.server";

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

/**
 * Generate a curated Funding Package for the authenticated sponsor.
 * Items sum exactly to monthly_budget; amounts in cents are signed so
 * the checkout layer can verify the client did not tamper with totals.
 */
export const getFundingPackage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({}).optional().parse(input))
  .handler(async ({ context }) => {
    const pkg = await buildFundingPackage(context.userId);
    return { package: pkg };
  });