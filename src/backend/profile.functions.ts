import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId, claims } = context;
    const { data } = await supabaseAdmin
      .from("profiles")
      .select("user_id, email, display_name, phone, avatar_url, created_at")
      .eq("user_id", userId)
      .maybeSingle();
    const email = (claims as { email?: string } | null)?.email ?? null;
    return { profile: data ?? { user_id: userId, email, display_name: null, phone: null, avatar_url: null, created_at: null } };
  });

const UpdateSchema = z.object({
  display_name: z.string().trim().max(120).optional().default(""),
  phone: z.string().trim().max(40).optional().default(""),
  avatar_url: z.string().trim().url().max(1000).optional().or(z.literal("")).default(""),
});

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => UpdateSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { userId, claims } = context;
    const email = (claims as { email?: string } | null)?.email ?? null;
    const { error } = await supabaseAdmin.from("profiles").upsert(
      {
        user_id: userId,
        email,
        display_name: data.display_name || null,
        phone: data.phone || null,
        avatar_url: data.avatar_url || null,
      },
      { onConflict: "user_id" }
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

