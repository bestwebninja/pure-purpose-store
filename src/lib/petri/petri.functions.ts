import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { allocateStabilizationSponsor } from "@/backend/petri/petriAllocation.server";

const intentSchema = z.object({
  sponsor_id: z.string().min(1).max(64),
  intent_type: z.enum([
    "veteran_stabilization",
    "family_shelter",
    "nutrition_only",
    "general_stabilization",
  ]),
  preferred_region: z.string().min(1).max(64),
  funding_capacity: z.number().min(0).max(1_000_000),
});

const schema = z.object({
  zip: z.string().min(1).max(16).regex(/^[A-Za-z0-9 \-]+$/),
  intent: intentSchema,
});

export const allocateStabilization = createServerFn({ method: "POST" })
  .inputValidator((input) => schema.parse(input))
  .handler(async ({ data }) => {
    return allocateStabilizationSponsor(data.intent, data.zip);
  });
