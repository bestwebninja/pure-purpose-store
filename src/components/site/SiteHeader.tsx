import { Link, useNavigate } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { checkIsAdmin } from "@/server/ngo.functions";

const NAV = [
  { to: "/", label: "Blessings" },
  { to: "/categories", label: "Categories" },
  { to: "/how-it-works", label: "How It Works" },
  { to: "/ngo", label: "For NGOs" },
  { to: "/transparency", label: "Transparency" },
  { to: "/about", label: "About" },
] as const;

export function SiteHeader() {
  const navigate = useNavigate();
  const checkAdmin = useServerFn(checkIsAdmin);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isSponsor, setIsSponsor] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const check = async (uid: string | undefined) => {
      if (!uid) {
        if (!cancelled) {
          setIsAdmin(false);
          setIsSponsor(false);
          setUserId(null);
        }
        return;
      }
      const [adminRes, sponsorRes] = await Promise.all([
        checkAdmin().catch(() => ({ isAdmin: false })),
        supabase.from("sponsors").select("id").eq("user_id", uid).maybeSingle(),
      ]);
      if (!cancelled) {
        setIsAdmin(!!adminRes?.isAdmin);
        setIsSponsor(!!sponsorRes.data);
        setUserId(uid);
      }
    };
    supabase.auth.getUser().then(({ data }) => check(data.user?.id));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => check(session?.user?.id));
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [checkAdmin]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

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
          {isSponsor && (
            <Link
              to="/sponsor/dashboard"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              Sponsor
            </Link>
          )}
          {isAdmin && (
            <>
            <Link
              to="/admin/ngo-dashboard"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              NGOs
            </Link>
            <Link
              to="/admin/sponsors"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              Sponsors
            </Link>
            <Link
              to="/admin/command-center"
              className="rounded-md bg-yellow-300 px-3 py-1 text-sm font-semibold text-foreground shadow-[0_0_14px_rgba(250,204,21,0.7)] hover:bg-yellow-400"
            >
              Admin Dashboard
            </Link>
            </>
          )}
          {userId && (
            <>
            <Link
              to="/me/giving"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              My Giving
            </Link>
            <Link
              to="/me/profile"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              Profile
            </Link>
            </>
          )}
        </nav>
        <div className="flex items-center gap-2">
          {!isSponsor && (
            <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
              <Link to="/become-blessing-sponsor">Become a Sponsor</Link>
            </Button>
          )}
          {userId ? (
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex" onClick={handleSignOut}>
              Sign out
            </Button>
          ) : (
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/login">Login</Link>
            </Button>
          )}
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