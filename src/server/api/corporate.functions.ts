import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(userId: string) {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden: admin role required");
}

const CorporateSchema = z.object({
  company_name: z.string(),
  industry: z.string().optional().default(""),
  website: z.string().optional().default(""),

  poc_name: z.string(),
  poc_email: z.string().email(),
  poc_phone: z.string().optional().default(""),
  poc_department: z.string().optional().default(""),
  poc_role: z.string().optional().default(""),

  address_line1: z.string().optional().default(""),
  address_line2: z.string().optional().default(""),
  city: z.string().optional().default(""),
  state: z.string().optional().default(""),
  zip: z.string().optional().default(""),
  country: z.string().optional().default(""),

  company_size: z.string().optional().default(""),

  contribution_type: z.string().optional().default(""),
  contribution_frequency: z.string().optional().default(""),

  sponsorship_interest: z.string().optional().default(""),
  branding_interest: z.string().optional().default(""),

  budget_range: z.string().optional().default(""),
  notes: z.string().optional().default(""),
});

export const submitCorporateApplication = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => CorporateSchema.parse(input))
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("corporate_sponsors")
      .insert({
        company_name: data.company_name,
        industry: data.industry,
        website: data.website,

        poc_name: data.poc_name,
        poc_email: data.poc_email,
        poc_phone: data.poc_phone,
        poc_department: data.poc_department,
        poc_role: data.poc_role,

        address_line1: data.address_line1,
        address_line2: data.address_line2,
        city: data.city,
        state: data.state,
        zip: data.zip,
        country: data.country,

        company_size: data.company_size,

        contribution_type: data.contribution_type,
        contribution_frequency: data.contribution_frequency,

        sponsorship_interest: data.sponsorship_interest,
        branding_interest: data.branding_interest,

        budget_range: data.budget_range,
        notes: data.notes,

        status: "PENDING",
      })
      .select("*")
      .single();

    if (error) throw new Error(error.message);

    return { ok: true, id: row.id };
  });

export const listCorporateSponsors = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("corporate_sponsors")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    return { sponsors: data ?? [] };
  });