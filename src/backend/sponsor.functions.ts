import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { assertAllowedCountry } from "@/lib/data-sovereignty";

const SponsorSchema = z.object({
// data sovereignty layer
   sponsor_role: z.enum(["Rabbi", "Company-Sponsor", "Minister", "A Friend", "Family Member", "Good Human"]),
  organization_name: z.string().trim().max(200).optional().default(""),
  organization_details: z.string().trim().max(1000).optional().default(""),
  city: z.string().trim().max(120).optional().default(""),
  state: z.string().trim().max(120).optional().default(""),
  zip: z.string().trim().max(40).optional().default(""),
  country: z.string().trim().max(80).optional().default(""),
  help_interests: z.array(z.string().min(1).max(60)).max(20).default([]),
  verification_notes: z.string().trim().max(2000).optional().default(""),
  first_name: z.string().trim().max(80).optional().default(""),
  last_name: z.string().trim().max(80).optional().default(""),
  email: z.string().trim().email().max(255).optional().or(z.literal("")).default(""),
  phone: z.string().trim().max(40).optional().default(""),
});

export const createSponsorProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SponsorSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const display_name = [data.first_name, data.last_name].filter(Boolean).join(" ").trim();
    // Ensure profile exists / is updated with name+phone
    if (display_name || data.phone || data.email) {
      await supabaseAdmin.from("profiles").upsert(
        {
          user_id: userId,
          display_name: display_name || null,
          email: data.email || null,
          phone: data.phone || null,
        },
        { onConflict: "user_id" }
      );
    }
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
          country: data.country ? assertAllowedCountry(data.country) : null,
          help_interests: data.help_interests,
          verification_notes: data.verification_notes || null,
          verification_status: "PENDING",
        },
        { onConflict: "user_id" }
      )
      .select("id")
      .single();
    if (error) {
      console.error("[sponsor.createSponsorProfile] upsert failed", { userId, role: data.sponsor_role, error: error.message });
      throw new Error(`Sponsor profile save failed: ${error.message}`);
    }

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

async function assertAdmin(userId: string) {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden: admin role required");
}

export const listSponsors = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("sponsors")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { sponsors: data ?? [] };
  });

const UpdateSponsorStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["VERIFIED", "REJECTED", "PENDING"]),
});

export const updateSponsorStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => UpdateSponsorStatusSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("sponsors")
      .update({ verification_status: data.status })
      .eq("id", data.id);
    if (error) {
      console.error("[sponsor.updateSponsorStatus] update failed", { sponsorId: data.id, status: data.status, actorId: context.userId, error: error.message });
      throw new Error(`Sponsor status update failed: ${error.message}`);
    }
    await supabaseAdmin.from("audit_logs").insert({
      actor_id: context.userId,
      action: data.status === "VERIFIED" ? "SPONSOR_VERIFIED" : data.status === "REJECTED" ? "SPONSOR_REJECTED" : "SPONSOR_STATUS_CHANGED",
      entity_type: "sponsor",
      entity_id: data.id,
      metadata: { status: data.status },
    });
    return { ok: true };
  });

