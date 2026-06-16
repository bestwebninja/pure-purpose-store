import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { recommendForSponsor } from "@/lib/sponsor-decision.server";

export const getSponsorRecommendations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const recommendations = await recommendForSponsor(context.userId);
    return { recommendations };
  });
