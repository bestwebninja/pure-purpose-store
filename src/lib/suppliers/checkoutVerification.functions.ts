import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { verifyFulfillmentBeforeCheckout } from "@/server/suppliers/checkoutVerification.server";

const schema = z.object({
  zip: z.string().min(1).max(16).regex(/^[A-Za-z0-9 \-]+$/),
});

export const verifyCheckoutFulfillment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => schema.parse(input))
  .handler(async ({ data }) => {
    return verifyFulfillmentBeforeCheckout(data.zip);
  });
