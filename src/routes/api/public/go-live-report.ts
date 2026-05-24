import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Public health endpoint. Returns ONLY a binary live/not-live status.
 * No internal details (secret state, IDs, counts) are exposed.
 * For full diagnostics, use an admin-only endpoint.
 */
export const Route = createFileRoute("/api/public/go-live-report")({
  server: {
    handlers: {
      GET: async () => {
        let live = true;
        try {
          const { error } = await supabaseAdmin.from("campaigns").select("id").limit(1);
          if (error) live = false;
        } catch {
          live = false;
        }
        return Response.json({ live }, { status: live ? 200 : 503 });
      },
    },
  },
});

