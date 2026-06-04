import { createFileRoute, Link, Outlet, useMatches } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, ShieldCheck, Sparkles } from "lucide-react";

export const Route = createFileRoute("/ngo")({
  head: () => ({
    meta: [
      { title: "For NGOs — MyBlessings" },
      { name: "description", content: "Apply to receive blessings for your cause. Join the MyBlessings network of vetted nonprofits." },
      { property: "og:title", content: "For NGOs — MyBlessings" },
      { property: "og:description", content: "Apply to receive blessings for your cause." },
    ],
  }),
  component: NgoLanding,
});

function NgoLanding() {
  const matches = useMatches();
  const hasChild = matches.some((m) => m.routeId !== "/ngo" && m.routeId.startsWith("/ngo"));
  if (hasChild) return <Outlet />;
  return (
    <div className="mx-auto max-w-5xl px-6 py-20">
      <div className="text-center">
        <h1 className="text-display text-4xl font-semibold sm:text-5xl text-slate-200">Bring your mission to MyBlessings</h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground text-slate-200">
          Verified nonprofits raise funds with transparency, real-time donor updates, and zero platform fees on direct blessings.
        </p>
        <Button asChild size="lg" className="mt-8">
          <Link to="/ngo/onboarding">Start your application</Link>
        </Button>
      </div>
      <div className="mt-16 grid gap-6 sm:grid-cols-3">
        {[
          { icon: ShieldCheck, title: "Trust-first vetting", body: "Every NGO is reviewed by our intelligence engine and human team." },
          { icon: Heart, title: "Direct giving", body: "Donors connect with your cause and see exactly how funds are used." },
          { icon: Sparkles, title: "Free to join", body: "No setup or platform fees. We win when you do." },
        ].map((f) => (
          <Card key={f.title} className="p-6">
            <f.icon className="h-6 w-6 text-primary" />
            <h3 className="mt-3 font-semibold">{f.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground text-white">{f.body}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

