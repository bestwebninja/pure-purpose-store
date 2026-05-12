import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

type LayerMode = "all" | "layer1" | "layer2" | "layer3";

function explainEdge(m: Match | undefined, payload: Record<string, unknown> | null) {
  const b = (payload?.breakdown ?? {}) as {
    location_score?: number;
    category_score?: number;
    budget_score?: number;
    confidence_score?: number;
    final_decision_reason?: string;
  };
  const parts: string[] = [];
  if ((b.category_score ?? 0) >= 60) parts.push("same category");
  if ((b.location_score ?? 0) >= 70) parts.push("close location");
  if ((b.budget_score ?? 0) >= 60) parts.push("aligned budget");
  if ((m?.confidence_score ?? 0) > 0.65) parts.push("high confidence");
  return {
    summary: parts.length ? `Matched because ${parts.join(" + ")}.` : (b.final_decision_reason ?? "No explanation available."),
    breakdown: b,
  };
}

function PetriGraphPage() {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null);
  const [layer, setLayer] = useState<LayerMode>("all");
  const [timelinePct, setTimelinePct] = useState(100);
  const [drift, setDrift] = useState<{ pct: number; warn: boolean } | null>(null);

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

  // Drift detection: compare avg confidence in last 24h vs prior 24h.
  useEffect(() => {
    if (!tokens.length) { setDrift(null); return; }
    const now = Date.now();
    const day = 24 * 3600 * 1000;
    const recent = tokens.filter((t) => now - new Date(t.created_at).getTime() <= day);
    const prior = tokens.filter((t) => {
      const d = now - new Date(t.created_at).getTime();
      return d > day && d <= 2 * day;
    });
    const avg = (arr: Token[]) =>
      arr.length ? arr.reduce((s, t) => s + (t.confidence_score ?? 0), 0) / arr.length : 0;
    const a = avg(recent);
    const b = avg(prior);
    if (!b) { setDrift(null); return; }
    const pct = ((a - b) / b) * 100;
    setDrift({ pct, warn: Math.abs(pct) > 15 });
  }, [tokens]);

  // Time-bound the visible window via the timeline slider.
  const visibleTokens = useMemo(() => {
    if (timelinePct >= 100) return tokens;
    if (!tokens.length) return tokens;
    const times = tokens.map((t) => new Date(t.created_at).getTime());
    const min = Math.min(...times);
    const max = Math.max(...times);
    const cutoff = min + ((max - min) * timelinePct) / 100;
    return tokens.filter((t) => new Date(t.created_at).getTime() <= cutoff);
  }, [tokens, timelinePct]);

  const visibleMatches = useMemo(() => {
    if (timelinePct >= 100) return matches;
    if (!matches.length) return matches;
    const times = matches.map((m) => new Date(m.created_at).getTime());
    const min = Math.min(...times);
    const max = Math.max(...times);
    const cutoff = min + ((max - min) * timelinePct) / 100;
    return matches.filter((m) => new Date(m.created_at).getTime() <= cutoff);
  }, [matches, timelinePct]);

  const { nodes, edges } = useMemo(() => {
    const nodeMap = new Map<string, GraphNode>();
    const includeNodes = layer === "all" || layer === "layer1" || layer === "layer2";
    const includeEdges = layer === "all" || layer === "layer2" || layer === "layer3";
    if (includeNodes) for (const t of visibleTokens) {
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
    if (includeEdges) for (const m of visibleMatches) {
      if (layer === "layer3" && m.status !== "confirmed") continue;
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
  }, [visibleTokens, visibleMatches, layer]);

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
          <Badge variant="outline">v3</Badge>
          {drift?.warn && (
            <Badge variant="destructive">system drift {drift.pct > 0 ? "+" : ""}{drift.pct.toFixed(1)}%</Badge>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-md border p-1">
          {(["all", "layer1", "layer2", "layer3"] as LayerMode[]).map((m) => (
            <Button
              key={m}
              size="sm"
              variant={layer === m ? "default" : "ghost"}
              onClick={() => setLayer(m)}
            >
              {m === "all" ? "All Layers" : m === "layer1" ? "L1 · Signals" : m === "layer2" ? "L2 · Matching" : "L3 · Confirmed"}
            </Button>
          ))}
        </div>
        <div className="flex flex-1 items-center gap-2 min-w-[200px]">
          <span className="text-xs text-muted-foreground">Timeline</span>
          <input
            type="range"
            min={0}
            max={100}
            value={timelinePct}
            onChange={(e) => setTimelinePct(Number(e.target.value))}
            className="w-full"
          />
          <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">{timelinePct}%</span>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="p-4">
           {nodes.length === 0 ? (
             <p className="p-8 text-center text-sm text-muted-foreground">
               No data yet. Submit a Give a Blessing or Bless Me to populate the graph.
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
          {selectedEdge && (() => {
            const m = (selectedEdge.data as { match?: Match })?.match;
            const reqToken = tokens.find((t) => (t.source_id ?? t.id) === (selectedEdge.source as GraphNode).id || (t.source_id ?? t.id) === (selectedEdge.source as unknown as string));
            const exp = explainEdge(m, reqToken?.payload ?? null);
            return (
              <div className="mt-3 space-y-2 text-sm">
                <div className="font-semibold">Match</div>
                <div>Score: <span className="font-mono">{selectedEdge.score}</span></div>
                <div>Status: <span className="font-mono">{selectedEdge.status}</span></div>
                {m?.confidence_score != null && (
                  <div>Confidence: <span className="font-mono">{(m.confidence_score * 100).toFixed(0)}%</span></div>
                )}
                <div className="rounded border border-primary/30 bg-primary/5 p-2 text-xs">
                  {exp.summary}
                </div>
                <pre className="max-h-96 overflow-auto rounded bg-muted p-2 text-xs">
{JSON.stringify({ match: m, explanation: exp.breakdown }, null, 2)}
                </pre>
              </div>
            );
          })()}
        </Card>
      </div>
    </div>
  );
}