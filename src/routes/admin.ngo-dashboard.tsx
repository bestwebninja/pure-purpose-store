import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { type VettingMatrixEntry } from "@/integrations/supabase/types.ngo";
import { listNgoApplications, updateNgoStatus } from "@/server/api/gateway";

export const Route = createFileRoute("/admin/ngo-dashboard")({
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
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-display text-3xl font-semibold text-white">Admin Dashboard</h1>
        <Card className="mt-6 p-6">
          <p className="text-sm text-destructive">{error}</p>
          <p className="mt-2 text-sm text-muted-foreground">You must be signed in as an admin to view this page.</p>
        </Card>
      </div>
    );
  }

  if (selectedApp) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-16">
        <Button variant="ghost" onClick={() => setSelectedApp(null)} className="mb-6 text-white hover:text-yellow-400">
          ← Back to NGO Applications
        </Button>
        <h1 className="text-display text-3xl font-semibold text-white">Verification Audit: {selectedApp.name}</h1>
        
        {vettingMatrix ? (
          <div className="mt-8 overflow-hidden rounded-xl border border-white/10 bg-card shadow-card">
            <table className="w-full text-left">
              <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-4">Data Point</th>
                  <th className="px-6 py-4">User Input</th>
                  <th className="px-6 py-4">ProPublica Data</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Action Required</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {vettingMatrix.map((m, i) => (
                  <tr key={i} className={
                    m.status === "FAIL" ? "bg-red-500/10" : 
                    m.status === "FLAG" ? "bg-yellow-500/10" : 
                    "bg-green-500/5"
                  }>
                    <td className="px-6 py-4 font-medium text-white">{m.point}</td>
                    <td className="px-6 py-4 text-sm text-white/70">{m.userInput}</td>
                    <td className="px-6 py-4 text-sm text-white/70">{m.proData}</td>
                    <td className="px-6 py-4">
                      <Badge variant={m.status === "PASS" ? "default" : m.status === "FAIL" ? "destructive" : "secondary"}>
                        {m.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{m.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-8 text-muted-foreground italic">No automated vetting record found for this application.</p>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-display text-3xl font-semibold text-white">NGO Applications</h1>
      <p className="mt-2 text-muted-foreground text-slate-50">Live admin view — updates in realtime.</p>
      <div className="mt-8 space-y-3">
        {apps === null && <p className="text-sm text-muted-foreground">Loading…</p>}
        {apps?.length === 0 && <p className="text-sm text-muted-foreground">No applications yet.</p>}
        {apps?.map((a) => (
          <Card key={a.id} className="flex flex-wrap items-center justify-between gap-4 p-5 hover:border-yellow-400/50 transition-colors cursor-pointer" onClick={() => handleSelectApp(a)}>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold">{a.name}</h3>
                <Badge variant={a.status === "ACTIVE" ? "default" : a.status === "REJECTED" ? "destructive" : "secondary"}>
                  {a.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{a.email} · {a.country} · {a.geography}</p>
              <p className="mt-1 text-xs text-muted-foreground">Causes: {a.causes.join(", ")}</p>
              <p className="mt-1 text-xs">Trust: <span className="font-medium">{a.trust_score}</span> · {a.intelligence_status}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => handleStatus(a.id, "ACTIVE")} disabled={a.status === "ACTIVE"}>Approve</Button>
              <Button size="sm" variant="outline" onClick={() => handleStatus(a.id, "REJECTED")} disabled={a.status === "REJECTED"}>Reject</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}


