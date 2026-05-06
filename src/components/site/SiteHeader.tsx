import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, ChevronDown, UserCircle2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { to: "/", label: "Blessings" },
  { to: "/categories", label: "Categories" },
  { to: "/ngo", label: "NGO" },
] as const;

export function SiteHeader() {
  const navigate = useNavigate();
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
      const [adminRes, sponsorRes] = await Promise.allSettled([
        supabase.from("user_roles").select("role").eq("user_id", uid).eq("role", "admin").maybeSingle(),
        supabase.from("sponsors").select("id").eq("user_id", uid).maybeSingle(),
      ]);
      if (!cancelled) {
        setIsAdmin(adminRes.status === "fulfilled" && !!adminRes.value.data);
        setIsSponsor(sponsorRes.status === "fulfilled" && !!sponsorRes.value.data);
        setUserId(uid);
      }
    };
    supabase.auth.getUser().then(({ data }) => check(data.user?.id));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      window.setTimeout(() => check(session?.user?.id), 0);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full shadow-soft" style={{ background: "linear-gradient(135deg, #ff6f91 0%, #ff3d6e 50%, #e11d48 100%)" }}>
            <Heart className="h-4 w-4 text-white" fill="currentColor" />
          </span>
          <span className="text-display text-lg font-semibold tracking-tight">MyBlessings</span>
        </Link>
        <nav className="hidden flex-1 items-center justify-center gap-6 lg:flex">
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
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center gap-1 rounded-md bg-yellow-300 px-3 py-1.5 text-sm font-semibold text-foreground shadow-[0_0_14px_rgba(250,204,21,0.7)] outline-none transition hover:bg-yellow-400">
                <ShieldCheck className="h-4 w-4" />
                Admin
                <ChevronDown className="h-3.5 w-3.5 opacity-70" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>Admin tools</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/admin/command-center">Command Center</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/admin/ngo-dashboard">NGOs</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/admin/sponsors">Sponsors</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          {!isSponsor && (
            <Button asChild variant="ghost" size="sm" className="hidden text-sm xl:inline-flex hover:bg-yellow-300 hover:text-foreground">
              <Link to="/become-blessing-sponsor">Become a Sponsor</Link>
            </Button>
          )}
          {userId ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="hidden h-9 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-muted-foreground outline-none transition hover:bg-muted hover:text-foreground sm:inline-flex">
                <UserCircle2 className="h-5 w-5" />
                Account
                <ChevronDown className="h-3.5 w-3.5 opacity-70" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to="/me/giving">My Giving</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/me/profile">Profile</Link>
                </DropdownMenuItem>
                {isSponsor && (
                  <DropdownMenuItem asChild>
                    <Link to="/sponsor/dashboard">Sponsor Dashboard</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleSignOut}>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="ghost" size="sm" className="hidden text-sm sm:inline-flex hover:bg-yellow-300 hover:text-foreground">
              <Link to="/login">Login</Link>
            </Button>
          )}
          <Button
            asChild
            size="default"
            className="text-xl hover:opacity-95"
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