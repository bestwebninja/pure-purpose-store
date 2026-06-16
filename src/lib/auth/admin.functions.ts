import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Client-safe RPC for admin role check.
 *
 * Lives under `src/lib/` (not `src/server/`) so the route-guard
 * `requireAdmin.ts` can import it without tripping TanStack Start's
 * client-bundle import protection on `src/server/*`. The TanStack
 * server-fn Vite plugin transforms the `.handler()` body into a
 * server-only chunk and replaces this import with a fetch stub on
 * the client.
 */
export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    return { isAdmin: !!data };
  });
