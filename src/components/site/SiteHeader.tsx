import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, ChevronDown, UserCircle2, ShieldCheck, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { GiveBlessingButton } from "@/components/site/GiveBlessingButton";
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
    { to: "/explore-blessings", label: "Our Blessings" },
   { to: "/request-help", label: "BlessME" },
   { to: "/my-blessings", label: "My Blessings" },
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
              className="font-medium text-muted-foreground transition-colors hover:text-foreground font-serif text-lg"
              activeProps={{ className: "text-foreground" }}
            >
              {item.label}
            </Link>
          ))}
          {isSponsor && (
            <Link
              to="/sponsor/dashboard"
              className="font-medium text-muted-foreground transition-colors hover:text-foreground font-serif text-lg"
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
                <DropdownMenuItem asChild className="focus:bg-yellow-300 focus:text-foreground data-[highlighted]:bg-yellow-300 data-[highlighted]:text-foreground">
                  <Link to="/admin/command-center">Command Center</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="focus:bg-yellow-300 focus:text-foreground data-[highlighted]:bg-yellow-300 data-[highlighted]:text-foreground">
                  <Link to="/admin/ngo-dashboard">NGO Applications</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="focus:bg-yellow-300 focus:text-foreground data-[highlighted]:bg-yellow-300 data-[highlighted]:text-foreground">
                  <Link to="/admin/sponsors">Sponsors</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
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
            <Button asChild variant="ghost" size="sm" className="hidden text-sm xl:inline-flex hover:bg-yellow-300 hover:text-foreground">
              <Link to="/become-blessing-sponsor">Become a Sponsor</Link>
            </Button>
          )}
          {userId ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="hidden h-9 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-muted-foreground outline-none transition hover:bg-muted hover:text-foreground sm:inline-flex">
                <Avatar className="h-7 w-7">
                  {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName ?? "Account"} /> : null}
                  <AvatarFallback className="text-[11px]">{initials}</AvatarFallback>
                </Avatar>
                <span className="hidden md:inline">Account</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-70" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild className="focus:bg-yellow-300 focus:text-foreground data-[highlighted]:bg-yellow-300 data-[highlighted]:text-foreground">
                  <Link to="/me/giving">My Giving</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="focus:bg-yellow-300 focus:text-foreground data-[highlighted]:bg-yellow-300 data-[highlighted]:text-foreground">
                  <Link to="/me/profile">Profile</Link>
                </DropdownMenuItem>
                {isSponsor && (
                  <DropdownMenuItem asChild className="focus:bg-yellow-300 focus:text-foreground data-[highlighted]:bg-yellow-300 data-[highlighted]:text-foreground">
                    <Link to="/sponsor/dashboard">Sponsor Dashboard</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleSignOut} className="focus:bg-yellow-300 focus:text-foreground data-[highlighted]:bg-yellow-300 data-[highlighted]:text-foreground">Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="ghost" size="sm" className="hidden text-sm sm:inline-flex hover:bg-yellow-300 hover:text-foreground">
              <Link to="/login">Login</Link>
            </Button>
          )}
          <GiveBlessingButton />
        </div>
      </div>
    </header>
  );
}

