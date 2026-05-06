import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const SponsorSchema = z.object({
  sponsor_role: z.enum(["Rabbi", "Pastor", "Minister", "Faith Giver", "Counsellor", "Community Worker"]),
  organization_name: z.string().trim().max(200).optional().default(""),
  organization_details: z.string().trim().max(1000).optional().default(""),
  city: z.string().trim().max(120).optional().default(""),
  state: z.string().trim().max(120).optional().default(""),
  zip: z.string().trim().max(40).optional().default(""),
  country: z.string().trim().max(80).optional().default(""),
  help_interests: z.array(z.string().min(1).max(60)).max(20).default([]),
  verification_notes: z.string().trim().max(2000).optional().default(""),
});

export const createSponsorProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SponsorSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: row, error } = await supabaseAdmin
      .from("sponsors")
      .upsert(
        {
          user_id: userId,
          sponsor_role: data.sponsor_role,
          organization_name: data.organization_name || null,
          organization_details: data.organization_details || null,
          city: data.city || null,
          state: data.state || null,
          zip: data.zip || null,
          country: data.country || null,
          help_interests: data.help_interests,
          verification_notes: data.verification_notes || null,
          verification_status: "PENDING",
        },
        { onConflict: "user_id" }
      )
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("audit_logs").insert({
      actor_id: userId,
      action: "SPONSOR_CREATED",
      entity_type: "sponsor",
      entity_id: row.id,
      metadata: {
        sponsor_role: data.sponsor_role,
        organization_name: data.organization_name,
        help_interests: data.help_interests,
      },
    });

    return { id: row.id };
  });

export const getMySponsorProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data, error } = await supabaseAdmin
      .from("sponsors")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { sponsor: data };
  });