import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { PetriGraphView, type GraphEdge, type GraphNode } from "@/components/petri/PetriGraphView";

export const Route = createFileRoute("/dashboard/petri-graph")({
  head: () => ({
    meta: [
      { title: "Petri Graph Inspector — MyBlessings" },
      { name: "description", content: "Real-time view of Petri Bloom intents and matches." },
    ],
  }),
  component: PetriGraphPage,
});

type Token = {
  id: string;
  source_id: string | null;
  payload: Record<string, unknown> | null;
  status: string;
  score: number;
  confidence_score: number | null;
  match_generation: string | null;
  created_at: string;
};

type Match = {
  id: string;
  help_request_id: string | null;
  sponsor_id: string | null;
  score: number;
  status: string;
  confidence_score: number | null;
  created_at: string;
};

function PetriGraphPage() {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null);

  // Auth + admin gate
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!data.user) {
        navigate({ to: "/login" });
        return;
      }
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id);
      const isAdmin = (roles ?? []).some((r: { role: string }) => r.role === "admin");
      setAllowed(isAdmin);
      setAuthChecked(true);
    })();
    return () => { cancelled = true; };
  }, [navigate]);

  // Initial fetch
  useEffect(() => {
    if (!allowed) return;
    (async () => {
      const [{ data: t }, { data: m }] = await Promise.all([
        supabase.from("petri_tokens").select("*").order("created_at", { ascending: false }).limit(200),
        supabase.from("petri_matches").select("*").order("created_at", { ascending: false }).limit(200),
      ]);
      setTokens((t ?? []) as unknown as Token[]);
      setMatches((m ?? []) as unknown as Match[]);
    })();
  }, [allowed]);

  // Realtime subscriptions
  useEffect(() => {
    if (!allowed) return;
    const channel = supabase
      .channel("petri-graph")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "petri_tokens" },
        (p) => setTokens((prev) => [p.new as unknown as Token, ...prev].slice(0, 400)),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "petri_matches" },
        (p) => setMatches((prev) => [p.new as unknown as Match, ...prev].slice(0, 400)),
      )
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [allowed]);

  const { nodes, edges } = useMemo(() => {
    const nodeMap = new Map<string, GraphNode>();
    for (const t of tokens) {
      const p = (t.payload ?? {}) as { source_type?: string; location?: { city?: string; country?: string }; category_ids?: string[]; budget?: number };
      const kind: "request" | "intent" = p.source_type === "request" ? "request" : "intent";
      const id = t.source_id ?? t.id;
      if (!nodeMap.has(id)) {
        const loc = [p.location?.city, p.location?.country].filter(Boolean).join(", ") || "—";
        nodeMap.set(id, {
          id,
          kind,
          label: `${kind === "request" ? "Req" : "Spo"} · ${loc}`,
          data: { token: t, payload: p },
        });
      }
    }
    const es: GraphEdge[] = [];
    for (const m of matches) {
      if (!m.help_request_id || !m.sponsor_id) continue;
      // Synthesize endpoints if not seen yet
      if (!nodeMap.has(m.help_request_id)) {
        nodeMap.set(m.help_request_id, { id: m.help_request_id, kind: "request", label: "Req · ?", data: {} });
      }
      if (!nodeMap.has(m.sponsor_id)) {
        nodeMap.set(m.sponsor_id, { id: m.sponsor_id, kind: "intent", label: "Spo · ?", data: {} });
      }
      es.push({
        id: m.id,
        source: m.help_request_id,
        target: m.sponsor_id,
        score: m.score,
        status: m.status,
        data: { match: m },
      });
    }
    return { nodes: Array.from(nodeMap.values()), edges: es };
  }, [tokens, matches]);

  if (!authChecked) {
    return <div className="mx-auto max-w-6xl p-8 text-muted-foreground">Loading…</div>;
  }
  if (!allowed) {
    return (
      <div className="mx-auto max-w-6xl p-8">
        <h1 className="text-display text-2xl font-semibold">Petri Graph Inspector</h1>
        <p className="mt-2 text-muted-foreground">Admins only.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-display text-2xl font-semibold">Petri Graph Inspector</h1>
          <p className="text-sm text-muted-foreground">Live view of intents and matches in the Petri Bloom intelligence layer.</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline">{nodes.length} nodes</Badge>
          <Badge variant="outline">{edges.length} edges</Badge>
          <Badge variant="outline">v2</Badge>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="p-4">
          {nodes.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              No data yet. Submit a Give a Blessing or Request Help to populate the graph.
            </p>
          ) : (
            <PetriGraphView
              nodes={nodes}
              edges={edges}
              onNodeSelect={(n) => { setSelectedNode(n); setSelectedEdge(null); }}
              onEdgeSelect={(e) => { setSelectedEdge(e); setSelectedNode(null); }}
            />
          )}
        </Card>

        <Card className="p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Inspector</h2>
          {!selectedNode && !selectedEdge && (
            <p className="mt-3 text-sm text-muted-foreground">Click a node or edge to inspect.</p>
          )}
          {selectedNode && (
            <div className="mt-3 space-y-2 text-sm">
              <div className="font-semibold">{selectedNode.kind === "request" ? "Help Request" : "Sponsor Intent"}</div>
              <pre className="max-h-96 overflow-auto rounded bg-muted p-2 text-xs">
{JSON.stringify(selectedNode.data, null, 2)}
              </pre>
            </div>
          )}
          {selectedEdge && (
            <div className="mt-3 space-y-2 text-sm">
              <div className="font-semibold">Match</div>
              <div>Score: <span className="font-mono">{selectedEdge.score}</span></div>
              <div>Status: <span className="font-mono">{selectedEdge.status}</span></div>
              <pre className="max-h-96 overflow-auto rounded bg-muted p-2 text-xs">
{JSON.stringify(selectedEdge.data, null, 2)}
              </pre>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}