import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { getMySponsorProfile } from "@/server/sponsor.functions";

type Sponsor = {
  id: string;
  sponsor_role: string;
  organization_name: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  zip: string | null;
  help_interests: string[];
  verification_status: string;
  created_at: string;
};

export const Route = createFileRoute("/sponsor/dashboard")({
  head: () => ({ meta: [{ title: "Sponsor Dashboard — MyBlessings" }] }),
  component: SponsorDashboard,
});

function SponsorDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sponsor, setSponsor] = useState<Sponsor | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) {
        navigate({ to: "/login" });
        return;
      }
      try {
        const res = await getMySponsorProfile();
        if (cancelled) return;
        setSponsor(res.sponsor as Sponsor | null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (loading) {
    return <div className="mx-auto max-w-4xl px-6 py-16 text-muted-foreground">Loading…</div>;
  }

  if (!sponsor) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h1 className="text-display text-2xl font-semibold">No sponsor profile yet</h1>
        <p className="mt-2 text-sm text-muted-foreground">Complete your sponsor onboarding to access your dashboard.</p>
        <Button className="mt-6" asChild>
          <Link to="/become-blessing-sponsor">Become a Blessing Sponsor</Link>
        </Button>
      </div>
    );
  }

  const location = [sponsor.city, sponsor.state, sponsor.country].filter(Boolean).join(", ");

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display text-3xl font-semibold">Sponsor Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome back, {sponsor.organization_name || sponsor.sponsor_role}.</p>
        </div>
        <Badge variant={sponsor.verification_status === "VERIFIED" ? "default" : "secondary"}>
          {sponsor.verification_status}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-sm font-semibold text-muted-foreground">Profile</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div><dt className="inline text-muted-foreground">Role: </dt><dd className="inline font-medium">{sponsor.sponsor_role}</dd></div>
            <div><dt className="inline text-muted-foreground">Organisation: </dt><dd className="inline font-medium">{sponsor.organization_name || "—"}</dd></div>
            <div><dt className="inline text-muted-foreground">Location: </dt><dd className="inline font-medium">{location || "—"}</dd></div>
            <div><dt className="inline text-muted-foreground">Zip: </dt><dd className="inline font-medium">{sponsor.zip || "—"}</dd></div>
          </dl>
        </Card>

        <Card className="p-6">
          <h2 className="text-sm font-semibold text-muted-foreground">Help Interests</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {sponsor.help_interests.length === 0 ? (
              <span className="text-sm text-muted-foreground">None selected</span>
            ) : (
              sponsor.help_interests.map((h) => <Badge key={h} variant="outline">{h}</Badge>)
            )}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-sm font-semibold text-muted-foreground">Receivers & Cases</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Receiver intake and case management aren't available yet. Once approved, you'll be able to create
          Blessing Receivers and track active cases here.
        </p>
        <Button className="mt-4" disabled>Create Blessing Receiver (coming soon)</Button>
      </Card>
    </div>
  );
}