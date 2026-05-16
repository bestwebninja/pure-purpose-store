import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/public/health")({
  server: {
    handlers: {
      GET: async () => {
        const started = Date.now();
        let dbOk = false;
        try {
          const { error } = await supabaseAdmin.from("campaigns").select("id").limit(1);
          dbOk = !error;
        } catch {
          dbOk = false;
        }
        return Response.json({
          status: dbOk ? "ok" : "degraded",
          db: dbOk,
          uptime_ms: Date.now() - started,
          timestamp: new Date().toISOString(),
        });
      },
    },
  },
});

