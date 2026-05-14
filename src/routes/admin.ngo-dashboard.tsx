import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { listNgoApplications, updateNgoStatus } from "@/server/ngo.functions";

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
  country: string | null;
  causes: string[];
  geography: string | null;
  status: string;
  trust_score: number;
  intelligence_status: string;
  created_at: string;
};

function AdminDashboard() {
  const list = useServerFn(listNgoApplications);
  const update = useServerFn(updateNgoStatus);
  const [apps, setApps] = useState<Application[] | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-display text-3xl font-semibold text-white">NGO Applications</h1>
      <p className="mt-2 text-muted-foreground">Live admin view — updates in realtime.</p>
      <div className="mt-8 space-y-3">
        {apps === null && <p className="text-sm text-muted-foreground">Loading…</p>}
        {apps?.length === 0 && <p className="text-sm text-muted-foreground">No applications yet.</p>}
        {apps?.map((a) => (
          <Card key={a.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
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