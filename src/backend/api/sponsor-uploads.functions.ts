import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Sponsor profile asset uploads.
 *
 * Files are uploaded directly from the browser to the `sponsor-logos` (public)
 * and `sponsor-docs` (private) buckets under a folder named after the user id.
 * Storage RLS enforces ownership. After a successful upload the client calls
 * `updateSponsorAssets` so the resolved paths get written to the sponsor row
 * and a fresh public/signed URL is returned to the UI.
 */

const StorageRefSchema = z.object({
  bucket: z.enum(["sponsor-logos", "sponsor-docs"]),
  path: z.string().min(1).max(512),
});

const UpdateAssetsSchema = z.object({
  logo: StorageRefSchema.optional(),
  doc: StorageRefSchema.optional(),
});

export const updateSponsorAssets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => UpdateAssetsSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;

    // Both refs MUST point inside the user's own folder. Storage RLS would
    // also reject a cross-user write, but we double-check before persisting
    // anything to the sponsors row.
    for (const ref of [data.logo, data.doc].filter(Boolean) as Array<{ bucket: string; path: string }>) {
      const folder = ref.path.split("/")[0];
      if (folder !== userId) {
        throw new Error("Upload path does not belong to the current user");
      }
    }

    const update: { logo_url?: string | null; doc_url?: string | null } = {};
    let logoUrl: string | null = null;
    let docUrl: string | null = null;

    if (data.logo) {
      const { data: pub } = supabaseAdmin.storage.from(data.logo.bucket).getPublicUrl(data.logo.path);
      logoUrl = pub.publicUrl;
      update.logo_url = logoUrl;
    }

    if (data.doc) {
      // Private bucket — store the path; sign on demand.
      update.doc_url = data.doc.path;
      const { data: signed } = await supabaseAdmin.storage
        .from(data.doc.bucket)
        .createSignedUrl(data.doc.path, 60 * 60); // 1h preview link
      docUrl = signed?.signedUrl ?? null;
    }

    if (Object.keys(update).length === 0) {
      return { ok: true, logoUrl: null, docUrl: null };
    }

    const { error } = await supabaseAdmin
      .from("sponsors")
      .update(update)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("audit_logs").insert({
      actor_id: userId,
      action: "SPONSOR_ASSETS_UPDATED",
      entity_type: "sponsor",
      metadata: { fields: Object.keys(update) },
    });

    return { ok: true, logoUrl, docUrl };
  });

/**
 * Returns a short-lived signed URL for the current sponsor's verification doc,
 * so the dashboard can show a "View document" link without exposing the file
 * publicly.
 */
export const getMySponsorDocUrl = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data: sponsor } = await supabaseAdmin
      .from("sponsors")
      .select("doc_url")
      .eq("user_id", userId)
      .maybeSingle();

    if (!sponsor?.doc_url) return { url: null as string | null };

    const { data: signed } = await supabaseAdmin.storage
      .from("sponsor-docs")
      .createSignedUrl(sponsor.doc_url, 60 * 60);
    return { url: signed?.signedUrl ?? null };
  });
