import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { checkIsAdmin } from "@/lib/auth/admin.functions";

/**
 * Route `beforeLoad` guard for admin-only routes.
 *
 * Validates the role server-side via the `checkIsAdmin` server function,
 * which reads `public.user_roles` using the request-scoped Supabase client.
 * No client-side trust: localStorage / user_metadata are ignored.
 *
 *  - Unauthenticated  → redirect to /login (with redirect-back)
 *  - Authenticated, not admin → redirect to /login with `?forbidden=1`
 *    (UI surfaces a 403 notice; admin pages never render).
 */
export async function requireAdminBeforeLoad() {
  // Hydrate the Supabase session so the bearer token is attached to the
  // protected server-fn call. If no user is present, bounce to /login.
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userRes.user) {
    throw redirect({ to: "/login" });
  }

  try {
    const { isAdmin } = await checkIsAdmin();
    if (!isAdmin) throw redirect({ to: "/login" });
  } catch (e) {
    if (e && typeof e === "object" && "isRedirect" in (e as object)) throw e;
    throw redirect({ to: "/login" });
  }
}
