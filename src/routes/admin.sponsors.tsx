import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { listSponsors, updateSponsorStatus } from "@/server/api/gateway";
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
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-display text-3xl font-semibold text-white">Sponsor Verification</h1>
        <Card className="mt-6 p-6"><p className="text-sm text-destructive">{error}</p></Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-display text-3xl font-semibold text-white">Sponsor Verification</h1>
      <p className="mt-2 text-muted-foreground text-slate-50">Review and verify Blessing Sponsor applications.</p>
      <div className="mt-8 space-y-3">
        {sponsors === null && <p className="text-sm text-muted-foreground text-white">Loading…</p>}
        {sponsors?.length === 0 && <p className="text-sm text-muted-foreground text-white">No sponsor applications yet.</p>}
        {sponsors?.map((s) => (
          <Card key={s.id} className="flex flex-wrap items-start justify-between gap-4 p-5">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold">{s.organization_name || s.sponsor_role}</h3>
                <Badge variant={s.verification_status === "VERIFIED" ? "default" : s.verification_status === "REJECTED" ? "destructive" : "secondary"}>
                  {s.verification_status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground text-white">{s.sponsor_role} · {[s.city, s.country].filter(Boolean).join(", ") || "—"}</p>
              {s.help_interests?.length > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">Interests: {s.help_interests.join(", ")}</p>
              )}
              {s.verification_notes && <p className="mt-2 text-xs italic text-muted-foreground">"{s.verification_notes}"</p>}
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => handle(s.id, "VERIFIED")} disabled={s.verification_status === "VERIFIED"}>Verify</Button>
              <Button size="sm" variant="outline" onClick={() => handle(s.id, "REJECTED")} disabled={s.verification_status === "REJECTED"}>Reject</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}


