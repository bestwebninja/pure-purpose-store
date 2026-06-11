import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DashboardCard } from "@/components/ui/dashboard";
import { toast } from "sonner";
import {
  listMatchesForControl,
  approveMatch,
  rejectMatch,
  executeMatch,
  listFulfillmentForMatch,
} from "@/lib/gateway";
import { requireAdminBeforeLoad } from "@/lib/auth/requireAdmin";
import { AdminShell } from "@/components/admin/AdminShell";

type Match = {
  id: string;
  status: string;
  score: number;
  confidence_score: number;
  execution_status: string;
  provider: string | null;
  cost: number;
  currency: string;
  category: string | null;
  last_executed_at: string | null;
  created_at: string;
};

type Event = {
  id: string;
  provider: string | null;
  status: string | null;
  cost: number | null;
  currency: string | null;
  notes: string | null;
  created_at: string;
};

export const Route = createFileRoute("/admin/match-control")({
  beforeLoad: () => requireAdminBeforeLoad(),
  head: () => ({ meta: [{ title: "Match Control — MyBlessings" }, { name: "robots", content: "noindex" }] }),
  component: AdminMatchControl,
});

function execColor(s: string) {
  if (s === "executed") return "default";
  if (s === "failed") return "destructive";
  if (s === "skipped") return "secondary";
  return "outline";
}

function AdminMatchControl() {
  const list = useServerFn(listMatchesForControl);
  const approve = useServerFn(approveMatch);
  const reject = useServerFn(rejectMatch);
  const execute = useServerFn(executeMatch);
  const listEvents = useServerFn(listFulfillmentForMatch);

  const [matches, setMatches] = useState<Match[] | null>(null);
  const [events, setEvents] = useState<Record<string, Event[]>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const { matches } = await list();
      setMatches(matches as Match[]);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  }, [list]);

  useEffect(() => { refresh(); }, [refresh]);

  const handle = async (id: string, action: "approve" | "reject" | "execute") => {
    setBusy(`${action}:${id}`);
    try {
      if (action === "approve") await approve({ data: { id } });
      if (action === "reject") await reject({ data: { id } });
      if (action === "execute") await execute({ data: { id } });
      toast.success(`Match ${action}d`);
      await refresh();
      const { events } = await listEvents({ data: { id } });
      setEvents((prev) => ({ ...prev, [id]: events as Event[] }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : `${action} failed`);
    } finally {
      setBusy(null);
    }
  };

  const toggleEvents = async (id: string) => {
    if (events[id]) {
      setEvents((p) => { const n = { ...p }; delete n[id]; return n; });
      return;
    }
    try {
      const { events: ev } = await listEvents({ data: { id } });
      setEvents((p) => ({ ...p, [id]: ev as Event[] }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load events");
    }
  };

  if (error) {
    return (
      <AdminShell eyebrow="Admin · Matches" title="Match Control">
        <DashboardCard><p className="text-sm text-destructive">{error}</p></DashboardCard>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      eyebrow="Admin · Matches"
      title="Match Control"
      description="Approve, reject, or manually execute Petri Bloom matches. Executions route through the fulfillment router."
    >
      <div className="space-y-3">
        {matches === null && <p className="text-sm text-primary-foreground/70">Loading…</p>}
        {matches?.length === 0 && <p className="text-sm text-primary-foreground/70">No matches yet.</p>}
        {matches?.map((m) => (
          <DashboardCard key={m.id}>
            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <code className="text-xs text-muted-foreground">{m.id.slice(0, 8)}</code>
                  <Badge variant={m.status === "confirmed" ? "default" : m.status === "rejected" ? "destructive" : "secondary"}>
                    {m.status}
                  </Badge>
                  <Badge variant={execColor(m.execution_status) as "default" | "destructive" | "secondary" | "outline"}>
                    exec: {m.execution_status}
                  </Badge>
                  {m.category && <Badge variant="outline">{m.category}</Badge>}
                </div>
                <p className="mt-2 text-sm text-primary-foreground/70 break-words">
                  score {m.score} · confidence {(m.confidence_score * 100).toFixed(0)}%
                  {m.provider && <> · provider <span className="font-medium text-foreground">{m.provider}</span></>}
                  {m.cost > 0 && <> · cost {m.cost.toFixed(2)} {m.currency}</>}
                  {m.last_executed_at && <> · last run {new Date(m.last_executed_at).toLocaleString()}</>}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 sm:shrink-0">
                <Button size="sm" className="flex-1 sm:flex-none" onClick={() => handle(m.id, "approve")} disabled={!!busy || m.status === "rejected"}>
                  Approve & Execute
                </Button>
                <Button size="sm" variant="outline" className="flex-1 sm:flex-none" onClick={() => handle(m.id, "execute")} disabled={!!busy}>
                  Re-Execute
                </Button>
                <Button size="sm" variant="destructive" className="flex-1 sm:flex-none" onClick={() => handle(m.id, "reject")} disabled={!!busy || m.status === "rejected"}>
                  Reject
                </Button>
                <Button size="sm" variant="ghost" className="flex-1 text-primary-foreground sm:flex-none" onClick={() => toggleEvents(m.id)} disabled={!!busy}>
                  {events[m.id] ? "Hide" : "Events"}
                </Button>
              </div>
            </div>

            {events[m.id] && (
              <div className="mt-4 rounded-md border border-border/60 bg-muted/30 p-3">
                {events[m.id].length === 0 && <p className="text-xs text-muted-foreground">No fulfillment events.</p>}
                {events[m.id].map((e) => (
                  <div key={e.id} className="flex flex-wrap items-center justify-between gap-2 py-1 text-xs">
                    <span>{new Date(e.created_at).toLocaleString()}</span>
                    <span className="font-medium">{e.provider ?? "—"}</span>
                    <span>{e.status ?? "—"}</span>
                    <span>{Number(e.cost ?? 0).toFixed(2)} {e.currency ?? ""}</span>
                    <span className="italic text-muted-foreground">{e.notes}</span>
                  </div>
                ))}
              </div>
            )}
          </DashboardCard>
        ))}
      </div>
    </AdminShell>
  );
}


