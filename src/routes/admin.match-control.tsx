import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  listMatchesForControl,
  approveMatch,
  rejectMatch,
  executeMatch,
  listFulfillmentForMatch,
} from "@/server/api/gateway";

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
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-display text-3xl font-semibold text-white">Match Control</h1>
        <Card className="mt-6 p-6"><p className="text-sm text-destructive">{error}</p></Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="text-display text-2xl font-semibold sm:text-3xl">Match Control</h1>
      <p className="mt-2 text-muted-foreground text-slate-50">
        Approve, reject, or manually execute Petri Bloom matches. Executions route through the fulfillment router (stub providers).
      </p>

      <div className="mt-8 space-y-3">
        {matches === null && <p className="text-sm text-muted-foreground text-white">Loading…</p>}
        {matches?.length === 0 && <p className="text-sm text-muted-foreground text-white">No matches yet.</p>}
        {matches?.map((m) => (
          <Card key={m.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
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
                <p className="mt-2 text-sm text-muted-foreground text-white">
                  score {m.score} · confidence {(m.confidence_score * 100).toFixed(0)}%
                  {m.provider && <> · provider <span className="font-medium text-foreground">{m.provider}</span></>}
                  {m.cost > 0 && <> · cost {m.cost.toFixed(2)} {m.currency}</>}
                  {m.last_executed_at && <> · last run {new Date(m.last_executed_at).toLocaleString()}</>}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => handle(m.id, "approve")} disabled={!!busy || m.status === "rejected"}>
                  Approve & Execute
                </Button>
                <Button size="sm" variant="outline" onClick={() => handle(m.id, "execute")} disabled={!!busy}>
                  Re-Execute
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handle(m.id, "reject")} disabled={!!busy || m.status === "rejected"}>
                  Reject
                </Button>
                <Button size="sm" variant="ghost" className="text-white" onClick={() => toggleEvents(m.id)} disabled={!!busy}>
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
          </Card>
        ))}
      </div>
    </div>
  );
}


