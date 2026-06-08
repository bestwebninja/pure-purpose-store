import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronDown, ShieldCheck, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { GiveBlessingButton } from "@/components/site/GiveBlessingButton";
import logoAsset from "@/assets/myblessings-logo-v4.png.asset.json";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { to: "/explore-blessings", label: "Blessings" },
  { to: "/request-help", label: "BlessME" },
  { to: "/my-blessings", label: "My Blessings" },
  { to: "/marketplace", label: "Marketplace" },
  { to: "/impact-map", label: "Impact Map" },
] as const;

export function SiteHeader() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isSponsor, setIsSponsor] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const check = async (uid: string | undefined) => {
      if (!uid) {
        if (!cancelled) {
          setIsAdmin(false);
          setIsSponsor(false);
          setUserId(null);
          setAvatarUrl(null);
          setDisplayName(null);
        }
        return;
      }
      const [adminRes, sponsorRes, profileRes] = await Promise.allSettled([
        supabase.from("user_roles").select("role").eq("user_id", uid).eq("role", "admin").maybeSingle(),
        supabase.from("sponsors").select("id").eq("user_id", uid).maybeSingle(),
        supabase.from("profiles").select("avatar_url, display_name").eq("user_id", uid).maybeSingle(),
      ]);
      if (!cancelled) {
        setIsAdmin(adminRes.status === "fulfilled" && !!adminRes.value.data);
        setIsSponsor(sponsorRes.status === "fulfilled" && !!sponsorRes.value.data);
        setUserId(uid);
        const p = profileRes.status === "fulfilled" ? profileRes.value.data : null;
        setAvatarUrl(p?.avatar_url ?? null);
        setDisplayName(p?.display_name ?? null);
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

  const initials = (displayName || "?")
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 text-foreground backdrop-blur-md">
      <div className="mx-auto flex h-24 max-w-7xl items-center justify-between gap-2 px-3 sm:h-28 sm:gap-4 sm:px-6 text-primary">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <img src={logoAsset.url} alt="MyBlessings" className="h-10 w-10 sm:h-12 sm:w-12 rounded-md bg-white object-contain p-0.5 text-right" />
          <span className="text-display text-base font-semibold tracking-tight sm:text-lg">MyBlessings</span>
        </Link>
        
        <nav className="hidden flex-1 items-center justify-center gap-6 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="font-serif text-lg font-medium whitespace-nowrap text-primary/80 transition-colors hover:text-primary"
              activeProps={{ className: "text-primary font-semibold underline underline-offset-4" }}
            >
              {item.label}
            </Link>
          ))}
          {isSponsor && (
            <Link
              to="/sponsor/dashboard"
              className="font-serif text-lg font-medium whitespace-nowrap text-primary/80 transition-colors hover:text-primary"
              activeProps={{ className: "text-primary font-semibold underline underline-offset-4" }}
            >
              Sponsor
            </Link>
          )}
          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center gap-1 rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-accent-foreground shadow-soft outline-none transition hover:bg-accent/90">
                <ShieldCheck className="h-4 w-4 border-blue-400" />
                Admin
                <ChevronDown className="h-3.5 w-3.5 opacity-70" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>Admin tools</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="focus:bg-accent focus:text-accent-foreground data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground">
                  <Link to="/admin/command-center">Command Center</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="focus:bg-accent focus:text-accent-foreground data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground">
                  <Link to="/admin/ngo-dashboard">NGO Applications</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="focus:bg-accent focus:text-accent-foreground data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground">
                  <Link to="/admin/sponsors">Sponsors</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="focus:bg-accent focus:text-accent-foreground data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground">
                  <Link to="/admin/petri">Petri OS</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="focus:bg-accent focus:text-accent-foreground data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground">
                  <Link to="/admin/match-control">Match Control</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="focus:bg-accent focus:text-accent-foreground data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground">
                  <Link to="/admin/god-view">God View</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="focus:bg-accent focus:text-accent-foreground data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground">
                  <Link to="/dashboard/petri-graph">Petri Graph</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </nav>
        
        <div className="flex shrink-0 items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden text-primary hover:bg-primary/10 hover:text-primary" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(20rem,90vw)] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-1">
                {NAV.map((item) => (
                  <SheetClose asChild key={item.to}>
                    <Link
                      to={item.to}
                      className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                    >
                      {item.label}
                    </Link>
                  </SheetClose>
                ))}
                {isSponsor && (
                  <SheetClose asChild>
                    <Link to="/sponsor/dashboard" className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted">
                      Sponsor Dashboard
                    </Link>
                  </SheetClose>
                )}
                {!isSponsor && (
                  <SheetClose asChild>
                    <Link to="/become-blessing-sponsor" className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted">
                      Become a Sponsor
                    </Link>
                  </SheetClose>
                )}
                <SheetClose asChild>
                  <Link to="/ngo/onboarding" className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted">
                    NGO Onboarding
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link to="/corporate-signup" className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted">
                    Corporate Signup
                  </Link>
                </SheetClose>
                {isAdmin && (
                  <>
                    <div className="mt-3 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Admin</div>
                    <SheetClose asChild>
                      <Link to="/admin/command-center" className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted">Command Center</Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link to="/admin/ngo-dashboard" className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted">NGO Applications</Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link to="/admin/sponsors" className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted">Sponsors</Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link to="/admin/petri" className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted">Petri OS</Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link to="/admin/match-control" className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted">Match Control</Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link to="/admin/god-view" className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted">God View</Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link to="/dashboard/petri-graph" className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted">Petri Graph</Link>
                    </SheetClose>
                  </>
                )}
                <div className="mt-3 border-t pt-3">
                  {userId ? (
                    <>
                      <SheetClose asChild>
                        <Link to="/me/giving" className="block rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted">My Giving</Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link to="/me/profile" className="block rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted">Profile</Link>
                      </SheetClose>
                      <button onClick={handleSignOut} className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-foreground hover:bg-muted">Sign out</button>
                    </>
                  ) : (
                    <SheetClose asChild>
                      <Link to="/login" className="block rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted">Login</Link>
                    </SheetClose>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
          
          {!isSponsor && (
            <Button asChild variant="ghost" size="sm" className="hidden text-sm whitespace-nowrap xl:inline-flex text-primary hover:bg-accent hover:text-accent-foreground">
              <Link to="/become-blessing-sponsor">Become a Sponsor</Link>
            </Button>
          )}
          
          {userId ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="hidden h-9 items-center gap-1.5 rounded-md bg-accent px-3 text-sm font-semibold text-accent-foreground shadow-soft outline-none transition hover:bg-accent/90 sm:inline-flex">
                <Avatar className="h-7 w-7">
                  {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName ?? "Account"} /> : null}
                  <AvatarFallback className="text-[11px]">{initials}</AvatarFallback>
                </Avatar>
                <span className="hidden md:inline">Account</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-70" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild className="focus:bg-accent focus:text-accent-foreground data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground">
                  <Link to="/me/giving">My Giving</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="focus:bg-accent focus:text-accent-foreground data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground">
                  <Link to="/me/profile">Profile</Link>
                </DropdownMenuItem>
                {isSponsor && (
                  <DropdownMenuItem asChild className="focus:bg-accent focus:text-accent-foreground data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground">
                    <Link to="/sponsor/dashboard">Sponsor Dashboard</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleSignOut} className="focus:bg-accent focus:text-accent-foreground data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground">Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="ghost" size="sm" className="hidden text-sm sm:inline-flex text-primary hover:bg-accent hover:text-accent-foreground">
              <Link to="/login">Login</Link>
            </Button>
          )}
          <GiveBlessingButton />
        </div>
      </div>
    </header>
  );
}