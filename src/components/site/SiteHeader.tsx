import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { to: "/", label: "Blessings" },
  { to: "/categories", label: "Categories" },
  { to: "/how-it-works", label: "How It Works" },
  { to: "/ngo", label: "For NGOs" },
  { to: "/transparency", label: "Transparency" },
  { to: "/about", label: "About" },
] as const;

export function SiteHeader() {
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const check = async (userId: string | undefined) => {
      if (!userId) {
        if (!cancelled) setIsAdmin(false);
        return;
      }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      if (!cancelled) setIsAdmin(!!data);
    };
    supabase.auth.getUser().then(({ data }) => check(data.user?.id));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => check(session?.user?.id));
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full shadow-soft" style={{ background: "linear-gradient(135deg, #ff6f91 0%, #ff3d6e 50%, #e11d48 100%)" }}>
            <Heart className="h-4 w-4 text-white" fill="currentColor" />
          </span>
          <span className="text-display text-lg font-semibold tracking-tight">MyBlessings</span>
        </Link>
        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              to="/admin/ngo-dashboard"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              Admin
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to="/login">Login</Link>
          </Button>
          <Button
            asChild
            size="lg"
            className="text-2xl hover:opacity-95"
            style={{
              backgroundColor: "#1d4ed8",
              color: "#f8f6ee",
              fontFamily: '"Great Vibes", "Snell Roundhand", cursive',
              boxShadow:
                "0 0 20px 4px rgba(125, 200, 255, 0.85), 0 0 44px 10px rgba(255, 230, 120, 0.6), 0 0 72px 14px rgba(255, 215, 0, 0.35)",
            }}
          >
            <Link to="/give">Give a Blessing</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}