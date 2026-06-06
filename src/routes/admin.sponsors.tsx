import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardSection } from "@/components/ui/dashboard";
import { toast } from "sonner";
import { listSponsors, updateSponsorStatus } from "@/lib/gateway";
import { requireAdminBeforeLoad } from "@/lib/auth/requireAdmin";

type Sponsor = {
  id: string;
  sponsor_role: string;
  organization_name: string | null;
  city: string | null;
  country: string | null;
  help_interests: string[];
  verification_status: string;
  verification_notes: string | null;
  created_at: string;
};

export const Route = createFileRoute("/admin/sponsors")({
  beforeLoad: () => requireAdminBeforeLoad(),
  head: () => ({ meta: [{ title: "Sponsor Verification — MyBlessings" }, { name: "robots", content: "noindex" }] }),
  component: AdminSponsors,
});

function AdminSponsors() {
  const list = useServerFn(listSponsors);
  const update = useServerFn(updateSponsorStatus);
  const [sponsors, setSponsors] = useState<Sponsor[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const { sponsors } = await list();
      setSponsors(sponsors as Sponsor[]);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  }, [list]);

  useEffect(() => { refresh(); }, [refresh]);

  const handle = async (id: string, status: "VERIFIED" | "REJECTED") => {
    try {
      await update({ data: { id, status } });
      toast.success(`Sponsor ${status.toLowerCase()}`);
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
        <h1 className="text-display text-3xl font-semibold text-primary-foreground">Sponsor Verification</h1>
        <Card className="mt-6 p-6"><p className="text-sm text-destructive">{error}</p></Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <DashboardSection
        title="Sponsor Verification"
        description="Review and verify Blessing Sponsor applications."
      >
      <div className="space-y-3">
        {sponsors === null && <p className="text-sm text-primary-foreground/70">Loading…</p>}
        {sponsors?.length === 0 && <p className="text-sm text-primary-foreground/70">No sponsor applications yet.</p>}
        {sponsors?.map((s) => (
          <Card key={s.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:p-5">
            <div className="min-w-0 flex-1 basis-full sm:basis-auto">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h3 className="font-semibold break-words">{s.organization_name || s.sponsor_role}</h3>
                <Badge variant={s.verification_status === "VERIFIED" ? "default" : s.verification_status === "REJECTED" ? "destructive" : "secondary"}>
                  {s.verification_status}
                </Badge>
              </div>
              <p className="text-sm text-primary-foreground/70 break-words">{s.sponsor_role} · {[s.city, s.country].filter(Boolean).join(", ") || "—"}</p>
              {s.help_interests?.length > 0 && (
                <p className="mt-1 text-xs text-muted-foreground break-words">Interests: {s.help_interests.join(", ")}</p>
              )}
              {s.verification_notes && <p className="mt-2 text-xs italic text-muted-foreground break-words">"{s.verification_notes}"</p>}
            </div>
            <div className="flex flex-wrap gap-2 sm:shrink-0">
              <Button size="sm" className="flex-1 sm:flex-none" onClick={() => handle(s.id, "VERIFIED")} disabled={s.verification_status === "VERIFIED"}>Verify</Button>
              <Button size="sm" variant="outline" className="flex-1 sm:flex-none" onClick={() => handle(s.id, "REJECTED")} disabled={s.verification_status === "REJECTED"}>Reject</Button>
            </div>
          </Card>
        ))}
      </div>
      </DashboardSection>
    </div>
  );
}


