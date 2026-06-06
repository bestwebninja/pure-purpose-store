import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardSection } from "@/components/ui/dashboard";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { type VettingMatrixEntry } from "@/integrations/supabase/types.ngo";
import { listNgoApplications, updateNgoStatus } from "@/lib/gateway";
import { requireAdminBeforeLoad } from "@/lib/auth/requireAdmin";

export const Route = createFileRoute("/admin/ngo-dashboard")({
  beforeLoad: () => requireAdminBeforeLoad(),
  head: () => ({
    meta: [
      { title: "NGO Admin Dashboard — MyBlessings" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminDashboard,
});

type Application = {
  id: string;
  name: string;
  email: string;
  ein: string;
  organization_type: string;
  country: string | null;
  causes: string[];
  geography: string | null;
  status: "PENDING" | "ACTIVE" | "REJECTED";
  trust_score: number;
  intelligence_status: string;
  created_at: string;
};

function AdminDashboard() {
  const list = useServerFn(listNgoApplications);
  const update = useServerFn(updateNgoStatus);
  const [apps, setApps] = useState<Application[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [vettingMatrix, setVettingMatrix] = useState<VettingMatrixEntry[] | null>(null);

  const refresh = useCallback(async () => {
    try {
      const { applications } = await list();
      setApps(applications as Application[]);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  }, [list]);

  useEffect(() => {
    refresh();
    const channel = supabase
      .channel("ngo_applications_admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "ngo_applications" }, () => refresh())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  const handleSelectApp = async (app: Application) => {
    setSelectedApp(app);
    setVettingMatrix(null);
    const { data } = await supabase
      .from("audit_logs")
      .select("metadata")
      .eq("entity_id", app.id)
      .eq("action", "NGO_SUBMITTED")
      .maybeSingle();
    
    // Cast metadata to access vetting_matrix safely from Supabase Json type
    const metadata = data?.metadata as { vetting_matrix?: VettingMatrixEntry[] } | null;
    
    if (metadata?.vetting_matrix) {
      setVettingMatrix(metadata.vetting_matrix);
    }
  };

  const handleStatus = async (id: string, status: "ACTIVE" | "REJECTED") => {
    try {
      await update({ data: { id, status } });
      toast.success(`Application ${status.toLowerCase()}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
        <h1 className="text-display text-3xl font-semibold text-primary-foreground">Admin Dashboard</h1>
        <Card className="mt-6 p-6">
          <p className="text-sm text-destructive">{error}</p>
          <p className="mt-2 text-sm text-muted-foreground text-primary-foreground">You must be signed in as an admin to view this page.</p>
        </Card>
      </div>
    );
  }

  if (selectedApp) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
        <Button variant="ghost" onClick={() => setSelectedApp(null)} className="mb-6 text-primary-foreground hover:text-accent">
          ← Back to NGO Applications
        </Button>
        <h1 className="text-display text-2xl sm:text-3xl font-semibold text-primary-foreground break-words">Verification Audit: {selectedApp.name}</h1>
        
        {vettingMatrix ? (
          <div className="mt-8">
            {/* Mobile: card list */}
            <div className="space-y-3 md:hidden">
              {vettingMatrix.map((m, i) => (
                <Card
                  key={`m-${i}`}
                  className={`p-4 ${
                    m.status === "FAIL" ? "border-destructive/40 bg-destructive/10" :
                    m.status === "FLAG" ? "border-accent/40 bg-accent/15" :
                    "border-success/30 bg-success/10"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-semibold text-primary-foreground break-words">{m.point}</h4>
                    <Badge variant={m.status === "PASS" ? "default" : m.status === "FAIL" ? "destructive" : "secondary"}>
                      {m.status}
                    </Badge>
                  </div>
                  <dl className="mt-3 space-y-1.5 text-xs text-white/80">
                    <div><dt className="inline font-medium text-white/60">User input: </dt><dd className="inline break-words">{m.userInput}</dd></div>
                    <div><dt className="inline font-medium text-white/60">ProPublica: </dt><dd className="inline break-words">{m.proData}</dd></div>
                    <div><dt className="inline font-medium text-white/60">Action: </dt><dd className="inline break-words">{m.action}</dd></div>
                  </dl>
                </Card>
              ))}
            </div>
            {/* Tablet/desktop: full table */}
            <div className="hidden overflow-x-auto rounded-xl border border-white/10 bg-card shadow-card md:block">
            <table className="w-full text-left">
              <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-3 sm:px-6 sm:py-4">Data Point</th>
                  <th className="px-3 py-3 sm:px-6 sm:py-4">User Input</th>
                  <th className="px-3 py-3 sm:px-6 sm:py-4">ProPublica Data</th>
                  <th className="px-3 py-3 sm:px-6 sm:py-4">Status</th>
                  <th className="px-3 py-3 sm:px-6 sm:py-4">Action Required</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {vettingMatrix.map((m, i) => (
                  <tr key={i} className={
                    m.status === "FAIL" ? "bg-destructive/10" : 
                    m.status === "FLAG" ? "bg-accent/15" : 
                    "bg-success/10"
                  }>
                    <td className="px-3 py-3 sm:px-6 sm:py-4 font-medium text-primary-foreground">{m.point}</td>
                    <td className="px-3 py-3 sm:px-6 sm:py-4 text-sm text-white/70 break-words">{m.userInput}</td>
                    <td className="px-3 py-3 sm:px-6 sm:py-4 text-sm text-white/70 break-words">{m.proData}</td>
                    <td className="px-3 py-3 sm:px-6 sm:py-4">
                      <Badge variant={m.status === "PASS" ? "default" : m.status === "FAIL" ? "destructive" : "secondary"}>
                        {m.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 sm:px-6 sm:py-4 text-sm text-muted-foreground text-primary-foreground">{m.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        ) : (
          <p className="mt-8 text-muted-foreground italic">No automated vetting record found for this application.</p>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <DashboardSection title="NGO Applications" description="Live admin view — updates in realtime.">
      <div className="space-y-3">
        {apps === null && <p className="text-sm text-muted-foreground text-primary-foreground">Loading…</p>}
        {apps?.length === 0 && <p className="text-sm text-muted-foreground text-primary-foreground">No applications yet.</p>}
        {apps?.map((a) => (
          <Card key={a.id} className="flex cursor-pointer flex-col gap-4 p-4 transition-colors hover:border-accent/50 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:p-5" onClick={() => handleSelectApp(a)}>
            <div className="min-w-0 flex-1 basis-full sm:basis-auto">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold break-words">{a.name}</h3>
                <Badge variant={a.status === "ACTIVE" ? "default" : a.status === "REJECTED" ? "destructive" : "secondary"}>
                  {a.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground text-primary-foreground break-words">{a.email} · {a.country} · {a.geography}</p>
              <p className="mt-1 text-xs text-muted-foreground break-words">Causes: {a.causes.join(", ")}</p>
              <p className="mt-1 text-xs">Trust: <span className="font-medium">{a.trust_score}</span> · {a.intelligence_status}</p>
            </div>
            <div className="flex flex-wrap gap-2 sm:shrink-0" onClick={(e) => e.stopPropagation()}>
              <Button size="sm" className="flex-1 sm:flex-none" onClick={() => handleStatus(a.id, "ACTIVE")} disabled={a.status === "ACTIVE"}>Approve</Button>
              <Button size="sm" variant="outline" className="flex-1 sm:flex-none" onClick={() => handleStatus(a.id, "REJECTED")} disabled={a.status === "REJECTED"}>Reject</Button>
            </div>
          </Card>
        ))}
      </div>
      </DashboardSection>
    </div>
  );
}


