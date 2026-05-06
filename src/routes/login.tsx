import { createFileRoute } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { checkIsAdmin } from "@/server/ngo.functions";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — MyBlessings" },
      { name: "description", content: "Sign in to your MyBlessings dashboard to manage your giving." },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const checkAdmin = useServerFn(checkIsAdmin);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const routeAfterAuth = async (userId: string) => {
    const [{ isAdmin }, { data: sponsorRow }] = await Promise.all([
      checkAdmin(),
      supabase.from("sponsors").select("id").eq("user_id", userId).maybeSingle(),
    ]);
    if (isAdmin) navigate({ to: "/admin/command-center" });
    else if (sponsorRow) navigate({ to: "/sponsor/dashboard" });
    else navigate({ to: "/" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { display_name: displayName, phone },
          },
        });
        if (error) throw error;
        if (data.user && data.session) {
          toast.success("Account created");
          await routeAfterAuth(data.user.id);
        } else {
          toast.success("Check your email to confirm your account.");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
        if (data.user) await routeAfterAuth(data.user.id);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-24">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-gradient-primary text-primary-foreground shadow-soft">
        <Heart className="h-5 w-5" fill="currentColor" />
      </span>
      <h1 className="text-display mt-6 text-3xl font-semibold">
        {mode === "signin" ? "Welcome back" : "Create your account"}
      </h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        {mode === "signin" ? "Sign in to your dashboard." : "Sign up with email to get started."}
      </p>
      <Card className="mt-8 w-full p-6 shadow-card">
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required autoComplete="name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete={mode === "signin" ? "current-password" : "new-password"} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Sign up"}
          </Button>
        </form>
        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-foreground"
        >
          {mode === "signin" ? "No account? Sign up" : "Have an account? Sign in"}
        </button>
      </Card>
      <a href="/become-blessing-sponsor" className="mt-6 text-sm font-medium text-primary hover:underline">
        Become a Blessing Sponsor →
      </a>
    </div>
  );
}