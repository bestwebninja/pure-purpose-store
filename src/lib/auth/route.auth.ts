import { createClient } from "@supabase/supabase-js";

/**
 * ===========================
 * ROUTE AUTH RESOLVER
 * ===========================
 * Converts session → role → firewall identity
 */

export type UserRole = "public" | "protected" | "admin" | "petri";

export async function getUserRole(request?: Request): Promise<UserRole> {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return "public";

    const role = user?.user_metadata?.role;

    if (role === "petri") return "petri";
    if (role === "admin") return "admin";

    return "protected";
  } catch {
    return "public";
  }
}
