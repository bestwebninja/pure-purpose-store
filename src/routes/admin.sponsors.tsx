import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DashboardCard } from "@/components/ui/dashboard";
import { toast } from "sonner";
import { listSponsors, updateSponsorStatus } from "@/lib/gateway";
import { requireAdminBeforeLoad } from "@/lib/auth/requireAdmin";
import { AdminShell } from "@/components/admin/AdminShell";

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
  head: () => ({ meta: [{ title: "Sponsor Verification � MyBlessings" }, { name: "robots", content: "noindex" }] }),
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
<<<<<<< HEAD
      <AdminShell eyebrow="Admin � Sponsors" title="Sponsor Verification">
        <div className="surface-card p-6"><p className="text-sm text-destructive">{error}</p></div>
=======
      <AdminShell eyebrow="Admin · Sponsors" title="Sponsor Verification">
        <DashboardCard><p className="text-sm text-destructive">{error}</p></DashboardCard>
>>>>>>> 0fda86d7ee521118278c9b3c1a384b9a6a990537
      </AdminShell>
    );
  }

  return (
    <AdminShell
      eyebrow="Admin � Sponsors"
      title="Sponsor Verification"
      description="Review and verify Blessing Sponsor applications."
    >
      <div className="space-y-3">
        {sponsors === null && <p className="text-sm text-muted-foreground">Loading�</p>}
        {sponsors?.length === 0 && <p className="text-sm text-muted-foreground">No sponsor applications yet.</p>}
        {sponsors?.map((s) => (
<<<<<<< HEAD
          <div className="surface-card flex flex-col gap-4 p-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:p-5" key={s.id}>
=======
          <DashboardCard key={s.id} className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
>>>>>>> 0fda86d7ee521118278c9b3c1a384b9a6a990537
            <div className="min-w-0 flex-1 basis-full sm:basis-auto">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h3 className="font-semibold break-words text-foreground">{s.organization_name || s.sponsor_role}</h3>
                <Badge variant={s.verification_status === "VERIFIED" ? "default" : s.verification_status === "REJECTED" ? "destructive" : "secondary"}>
                  {s.verification_status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground break-words">{s.sponsor_role} � {[s.city, s.country].filter(Boolean).join(", ") || "�"}</p>
              {s.help_interests?.length > 0 && (
                <p className="mt-1 text-xs text-muted-foreground break-words">Interests: {s.help_interests.join(", ")}</p>
              )}
              {s.verification_notes && <p className="mt-2 text-xs italic text-muted-foreground break-words">"{s.verification_notes}"</p>}
            </div>
            <div className="flex flex-wrap gap-2 sm:shrink-0">
              <Button size="sm" className="flex-1 sm:flex-none" onClick={() => handle(s.id, "VERIFIED")} disabled={s.verification_status === "VERIFIED"}>Verify</Button>
              <Button size="sm" variant="outline" className="flex-1 sm:flex-none" onClick={() => handle(s.id, "REJECTED")} disabled={s.verification_status === "REJECTED"}>Reject</Button>
            </div>
<<<<<<< HEAD
          </div>
=======
          </DashboardCard>
>>>>>>> 0fda86d7ee521118278c9b3c1a384b9a6a990537
        ))}
      </div>
    </AdminShell>
  );
}


