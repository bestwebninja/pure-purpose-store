import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { recomputePetriScores } from "@/server/api/gateway";
import { approveFlywheelReport, listImpactReports } from "@/server/api/gateway";

export const Route = createFileRoute("/admin/god-view")({
  head: () => ({
    meta: [
      { title: "God View — MyBlessings Operator" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: GodView,
});

type SystemModule = {
  id: string;
  module_key: string;
  enabled: boolean;
  country_code: string | null;
  autonomy_level: number;
  updated_at: string;
};

type PetriMatch = {
  id: string;
  status: string;
  execution_status: string;
  category: string | null;
  provider: string | null;
  confidence_score: number;
  score: number;
  cost: number;
  currency: string;
  match_generation: string;
  created_at: string;
  last_executed_at: string | null;
};

type FulfillmentEvent = {
  id: string;
  event_type: string;
  status: string | null;
  provider: string | null;
  cost: number | null;
  currency: string | null;
  notes: string | null;
  created_at: string;
};

type Scorecard = {
  id: string;
  token_id: string;
  case_id: string | null;
  urgency: number;
  stability: number;
  delivery_confidence: number;
  sponsor_alignment: number;
  economic_impact: number;
  composite_score: number;
  autonomy_decision: "auto" | "queue" | "manual" | string;
  inputs: Record<string, unknown>;
  last_computed_at: string;
};

type RecomputeRunSummary = {
  scanned: number;
  written: number;
  duration_ms: number;
  matching_autonomy: number;
  trigger: string;
};

type ImpactReport = {
  id: string;
  sponsor_user_id: string;
  sponsor_id: string | null;
  package_signature: string;
  package_total: number;
  currency: string;
  status: "draft" | "pending_review" | "approved" | "sent" | "failed" | string;
  summary: string;
  autonomy_level: number;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
  next_package: { total?: number; items?: unknown[] } | null;
};

type FeedRow =
  | ({ kind: "match" } & PetriMatch)
  | ({ kind: "event" } & FulfillmentEvent);

const AUTONOMY_LABELS = ["Manual", "Suggest", "Assisted", "Autonomous"];

function StatTile({ label, value, hint, tone }: { label: string; value: string | number; hint?: string; tone?: "ok" | "warn" | "bad" | "info" }) {
  const ring = {
    ok: "ring-emerald-500/30",
    warn: "ring-amber-500/30",
    bad: "ring-destructive/40",
    info: "ring-primary/30",
  }[tone ?? "info"];
  return (
    <Card className={`p-4 ring-1 ${ring}`}>
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      {hint ? <div className="mt-1 text-xs text-muted-foreground">{hint}</div> : null}
    </Card>
  );
}

function fmtMoney(n: number | null | undefined, ccy = "USD") {
  const v = Number(n ?? 0);
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: ccy, maximumFractionDigits: 0 }).format(v);
  } catch {
    return `${ccy} ${v.toFixed(0)}`;
  }
}

function timeAgo(iso: string) {
  const d = Date.now() - new Date(iso).getTime();
  const s = Math.max(1, Math.floor(d / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function GodView() {
  const [authReady, setAuthReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [modules, setModules] = useState<SystemModule[]>([]);
  const [matches, setMatches] = useState<PetriMatch[]>([]);
  const [events, setEvents] = useState<FulfillmentEvent[]>([]);
  const [scorecards, setScorecards] = useState<Scorecard[]>([]);
  const [recomputing, setRecomputing] = useState(false);
  const [lastRecompute, setLastRecompute] = useState<RecomputeRunSummary | null>(null);
  const recompute = useServerFn(recomputePetriScores);
  const fetchReports = useServerFn(listImpactReports);
  const approveReport = useServerFn(approveFlywheelReport);
  const [reports, setReports] = useState<ImpactReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [counts, setCounts] = useState({
    sponsors: 0,
    sponsorsPending: 0,
    cases: 0,
    casesOpen: 0,
    ngos: 0,
    ngosPending: 0,
    providers: 0,
    sponsorships: 0,
    donationsTotal: 0,
  });
  const [loading, setLoading] = useState(true);

  // Auth gate
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted) return;
      if (!user) {
        setAuthReady(true);
        return;
      }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!mounted) return;
      setIsAdmin(!!data);
      setAuthReady(true);
    })();
    return () => { mounted = false; };
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [mods, m, e, sc, sponsors, sponsorsPending, cases, casesOpen, ngos, ngosPending, providers, sponsorships, donations] = await Promise.all([
        supabase.from("system_modules").select("*").order("module_key"),
        supabase.from("petri_matches").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("fulfillment_events").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("petri_scorecards").select("*").order("composite_score", { ascending: false }).limit(100),
        supabase.from("sponsors").select("id", { count: "exact", head: true }),
        supabase.from("sponsors").select("id", { count: "exact", head: true }).eq("verification_status", "PENDING"),
        supabase.from("cases").select("id", { count: "exact", head: true }),
        supabase.from("cases").select("id", { count: "exact", head: true }).in("status", ["APPROVED", "OPEN"]),
        supabase.from("ngo_applications").select("id", { count: "exact", head: true }),
        supabase.from("ngo_applications").select("id", { count: "exact", head: true }).eq("status", "PENDING"),
        supabase.from("providers").select("id", { count: "exact", head: true }),
        supabase.from("sponsorships").select("id", { count: "exact", head: true }),
        supabase.from("donations").select("amount"),
      ]);
      setModules((mods.data ?? []) as SystemModule[]);
      setMatches((m.data ?? []) as PetriMatch[]);
      setEvents((e.data ?? []) as FulfillmentEvent[]);
      setScorecards((sc.data ?? []) as Scorecard[]);
      const donationsTotal = (donations.data ?? []).reduce((s: number, r: { amount: number | string }) => s + Number(r.amount ?? 0), 0);
      setCounts({
        sponsors: sponsors.count ?? 0,
        sponsorsPending: sponsorsPending.count ?? 0,
        cases: cases.count ?? 0,
        casesOpen: casesOpen.count ?? 0,
        ngos: ngos.count ?? 0,
        ngosPending: ngosPending.count ?? 0,
        providers: providers.count ?? 0,
        sponsorships: sponsorships.count ?? 0,
        donationsTotal,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const loadReports = useCallback(async () => {
    setReportsLoading(true);
    try {
      const res = (await fetchReports()) as { reports: ImpactReport[] };
      setReports(res.reports ?? []);
    } catch (e) {
      toast.error("Failed to load reports", { description: e instanceof Error ? e.message : String(e) });
    } finally {
      setReportsLoading(false);
    }
  }, [fetchReports]);

  useEffect(() => {
    if (!isAdmin) return;
    loadReports();
  }, [isAdmin, loadReports]);

  const handleApproveReport = async (id: string) => {
    setApprovingId(id);
    try {
      await approveReport({ data: { reportId: id } });
      toast.success("Report approved & sent");
      await loadReports();
    } catch (e) {
      toast.error("Approval failed", { description: e instanceof Error ? e.message : String(e) });
    } finally {
      setApprovingId(null);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    loadAll();
  }, [isAdmin, loadAll]);

  // Realtime: AI Decisions feed
  useEffect(() => {
    if (!isAdmin) return;
    const channel = supabase
      .channel("god-view-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "petri_matches" }, (payload) => {
        setMatches((prev) => {
          const row = payload.new as PetriMatch;
          if (!row?.id) return prev;
          const without = prev.filter((p) => p.id !== row.id);
          return [row, ...without].slice(0, 100);
        });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "fulfillment_events" }, (payload) => {
        setEvents((prev) => [payload.new as FulfillmentEvent, ...prev].slice(0, 100));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isAdmin]);

  const feed: FeedRow[] = useMemo(() => {
    const rows: FeedRow[] = [
      ...matches.map((r) => ({ kind: "match" as const, ...r })),
      ...events.map((r) => ({ kind: "event" as const, ...r })),
    ];
    rows.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    return rows.slice(0, 80);
  }, [matches, events]);

  const updateModule = async (id: string, patch: Partial<SystemModule>) => {
    setModules((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
    const { error } = await supabase.from("system_modules").update(patch).eq("id", id);
    if (error) {
      toast.error("Update failed", { description: error.message });
      loadAll();
    } else {
      toast.success("Module updated");
    }
  };

  if (!authReady) {
    return <div className="mx-auto max-w-7xl px-6 py-16 text-sm text-muted-foreground">Loading…</div>;
  }
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-display text-3xl font-semibold text-white">God View</h1>
        <Card className="mt-6 p-6">
          <p className="text-sm">This console is restricted to operators with the admin role.</p>
        </Card>
      </div>
    );
  }

  const matchesPending = matches.filter((m) => m.status === "pending").length;
  const matchesUnfulfilled = matches.filter((m) => m.execution_status === "unfulfilled").length;

  const matchingAutonomy = (() => {
    const m = modules.find((x) => x.module_key === "matching" && !x.country_code);
    if (!m) return 1;
    return m.enabled ? m.autonomy_level : 0;
  })();
  const queueAutoCount = scorecards.filter((s) => s.autonomy_decision === "auto").length;
  const queueAwaiting = scorecards.filter((s) => s.autonomy_decision === "queue").length;

  const handleForceRecompute = async () => {
    setRecomputing(true);
    try {
      const res = (await recompute({ data: {} })) as RecomputeRunSummary & { ok: boolean };
      setLastRecompute(res);
      toast.success("Recompute complete", {
        description: `${res.scanned} scanned · ${res.written} written · ${res.duration_ms}ms`,
      });
      await loadAll();
    } catch (e) {
      toast.error("Recompute failed", { description: e instanceof Error ? e.message : "Unknown error" });
    } finally {
      setRecomputing(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Operator Console — Live</span>
          </div>
          <h1 className="text-display mt-1 text-3xl font-semibold tracking-tight">God View</h1>
        </div>
        <Button size="sm" variant="outline" onClick={loadAll} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </Button>
        <Button size="sm" onClick={handleForceRecompute} disabled={recomputing}>
          {recomputing ? "Recomputing…" : "Force Recompute"}
        </Button>
      </header>

      <section className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Sponsors" value={counts.sponsors} hint={`${counts.sponsorsPending} pending`} tone={counts.sponsorsPending ? "warn" : "ok"} />
        <StatTile label="Cases" value={counts.cases} hint={`${counts.casesOpen} open`} tone="info" />
        <StatTile label="NGOs" value={counts.ngos} hint={`${counts.ngosPending} pending`} tone={counts.ngosPending ? "warn" : "ok"} />
        <StatTile label="Providers" value={counts.providers} tone="info" />
        <StatTile label="Sponsorships" value={counts.sponsorships} tone="info" />
        <StatTile label="Donations" value={fmtMoney(counts.donationsTotal)} tone="ok" />
      </section>

      <Tabs defaultValue="ai" className="mt-6">
        <TabsList className="flex w-full flex-wrap justify-start gap-1 rounded-lg bg-muted/50 p-1">
          <TabsTrigger value="map">Global Map</TabsTrigger>
          <TabsTrigger value="sponsors">Sponsors</TabsTrigger>
          <TabsTrigger value="funding">Funding Flow</TabsTrigger>
          <TabsTrigger value="priority">Priority Queue</TabsTrigger>
          <TabsTrigger value="fulfillment">Fulfillment</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="ngo">NGO Trust</TabsTrigger>
          <TabsTrigger value="ai">AI Decisions Feed</TabsTrigger>
          <TabsTrigger value="treasury">Treasury</TabsTrigger>
          <TabsTrigger value="reports">Sponsor Reports</TabsTrigger>
          <TabsTrigger value="autonomy">Autonomy</TabsTrigger>
        </TabsList>

        <TabsContent value="priority" className="mt-4">
          <Card className="p-0">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Funding Priority Queue</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Heuristic composite from urgency, stability, delivery confidence, sponsor alignment, and economic impact.
                  {lastRecompute ? (
                    <> Last run: {lastRecompute.scanned} scanned, {lastRecompute.written} written, {lastRecompute.duration_ms}ms ({lastRecompute.trigger}).</>
                  ) : null}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300">
                  Matching autonomy L{matchingAutonomy} · {AUTONOMY_LABELS[matchingAutonomy]}
                </Badge>
                <Badge variant="outline">{queueAutoCount} auto-fund</Badge>
                <Badge variant="outline">{queueAwaiting} awaiting approval</Badge>
              </div>
            </div>
            <div className="max-h-[640px] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-card">
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Token / Case</TableHead>
                    <TableHead className="text-right">Urg</TableHead>
                    <TableHead className="text-right">Stab</TableHead>
                    <TableHead className="text-right">Deliv</TableHead>
                    <TableHead className="text-right">Align</TableHead>
                    <TableHead className="text-right">Impact</TableHead>
                    <TableHead className="text-right">Composite</TableHead>
                    <TableHead>Decision</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scorecards.length === 0 ? (
                    <TableRow><TableCell colSpan={9} className="text-center text-sm text-muted-foreground">No scorecards yet — hit "Force Recompute" to run the brain loop.</TableCell></TableRow>
                  ) : scorecards.map((s, i) => {
                    const decisionTone =
                      s.autonomy_decision === "auto" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                      : s.autonomy_decision === "queue" ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                      : "bg-muted text-muted-foreground";
                    const decisionLabel =
                      s.autonomy_decision === "auto" ? `Auto-fund (L${matchingAutonomy})`
                      : s.autonomy_decision === "queue" ? "Awaits approval"
                      : "Manual review";
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="text-xs tabular-nums text-muted-foreground">{i + 1}</TableCell>
                        <TableCell>
                          <div className="font-mono text-xs">{s.case_id ? `case:${s.case_id.slice(0, 8)}` : `tok:${s.token_id.slice(0, 8)}`}</div>
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">computed {timeAgo(s.last_computed_at)}</div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-xs">{Math.round(s.urgency)}</TableCell>
                        <TableCell className="text-right tabular-nums text-xs">{Math.round(s.stability)}</TableCell>
                        <TableCell className="text-right tabular-nums text-xs">{Math.round(s.delivery_confidence)}</TableCell>
                        <TableCell className="text-right tabular-nums text-xs">{Math.round(s.sponsor_alignment)}</TableCell>
                        <TableCell className="text-right tabular-nums text-xs">{Math.round(s.economic_impact)}</TableCell>
                        <TableCell className="text-right">
                          <span className="inline-flex items-center gap-2">
                            <span className="h-1.5 w-16 overflow-hidden rounded bg-muted">
                              <span className="block h-full bg-primary" style={{ width: `${Math.min(100, s.composite_score)}%` }} />
                            </span>
                            <span className="tabular-nums text-sm font-semibold">{Math.round(s.composite_score)}</span>
                          </span>
                        </TableCell>
                        <TableCell><Badge className={decisionTone}>{decisionLabel}</Badge></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="map" className="mt-4">
          <Card className="p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Global Map</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Geographic distribution of cases, sponsors, and providers. Map renderer comes online in Phase 4 â€” counts shown above
              already reflect live data scoped by country.
            </p>
          </Card>
        </TabsContent>

        <TabsContent value="sponsors" className="mt-4">
          <Card className="p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Sponsor pipeline</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <StatTile label="Total" value={counts.sponsors} tone="info" />
              <StatTile label="Pending verification" value={counts.sponsorsPending} tone={counts.sponsorsPending ? "warn" : "ok"} />
              <StatTile label="Active sponsorships" value={counts.sponsorships} tone="info" />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="funding" className="mt-4">
          <Card className="p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Funding flow</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <StatTile label="Donations" value={fmtMoney(counts.donationsTotal)} tone="ok" />
              <StatTile label="Sponsorships placed" value={counts.sponsorships} tone="info" />
              <StatTile label="Cases needing funding" value={counts.casesOpen} tone={counts.casesOpen ? "warn" : "ok"} />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="fulfillment" className="mt-4">
          <Card className="p-0">
            <div className="flex items-center justify-between p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Recent fulfillment events</h2>
              <Badge variant="outline">{events.length}</Badge>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground">No events yet</TableCell></TableRow>
                ) : events.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-xs text-muted-foreground">{timeAgo(e.created_at)}</TableCell>
                    <TableCell className="font-mono text-xs">{e.event_type}</TableCell>
                    <TableCell className="text-xs">{e.provider ?? "â€”"}</TableCell>
                    <TableCell><Badge variant="outline">{e.status ?? "â€”"}</Badge></TableCell>
                    <TableCell className="text-right tabular-nums">{fmtMoney(e.cost ?? 0, e.currency ?? "USD")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers" className="mt-4">
          <Card className="p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Suppliers / providers</h2>
            <p className="text-sm text-muted-foreground">
              {counts.providers} active provider{counts.providers === 1 ? "" : "s"} on file. Detailed supplier scorecards
              ship with the routing engine in Phase 4.
            </p>
          </Card>
        </TabsContent>

        <TabsContent value="ngo" className="mt-4">
          <Card className="p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">NGO trust</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <StatTile label="Applications" value={counts.ngos} tone="info" />
              <StatTile label="Pending review" value={counts.ngosPending} tone={counts.ngosPending ? "warn" : "ok"} />
              <StatTile label="Onboarded NGOs" value={counts.ngos - counts.ngosPending} tone="ok" />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="mt-4">
          <Card className="p-0">
            <div className="flex items-center justify-between border-b p-4">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">AI Decisions Feed</h2>
                <p className="mt-1 text-xs text-muted-foreground">Live stream of routing matches and fulfillment events.</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span><Badge variant="outline">{matchesPending}</Badge> pending</span>
                <span><Badge variant="outline">{matchesUnfulfilled}</Badge> unfulfilled</span>
              </div>
            </div>
            <div className="max-h-[640px] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-card">
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Detail</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feed.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground">Waiting for routing engine activityâ€¦</TableCell></TableRow>
                  ) : feed.map((row) => (
                    <TableRow key={`${row.kind}-${row.id}`}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{timeAgo(row.created_at)}</TableCell>
                      <TableCell>
                        {row.kind === "match"
                          ? <Badge className="bg-primary/10 text-primary hover:bg-primary/15">match Â· {row.match_generation}</Badge>
                          : <Badge variant="outline">event</Badge>}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {row.kind === "match"
                          ? <>cat:{row.category ?? "â€”"} Â· provider:{row.provider ?? "â€”"}</>
                          : <>{row.event_type} Â· {row.notes ?? "â€”"}</>}
                      </TableCell>
                      <TableCell className="text-xs tabular-nums">
                        {row.kind === "match" ? `${Math.round(Number(row.confidence_score) * 100)}%` : "â€”"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {row.kind === "match" ? `${row.status} / ${row.execution_status}` : (row.status ?? "â€”")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.kind === "match"
                          ? fmtMoney(Number(row.cost), row.currency)
                          : fmtMoney(Number(row.cost ?? 0), row.currency ?? "USD")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="treasury" className="mt-4">
          <Card className="p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Treasury</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <StatTile label="Lifetime donations" value={fmtMoney(counts.donationsTotal)} tone="ok" />
              <StatTile label="Sponsorships" value={counts.sponsorships} tone="info" />
              <StatTile label="Cases funded" value={counts.cases - counts.casesOpen} tone="ok" />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          <Card className="p-0">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Sponsor Reports â€” Funding Flywheel</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Drafts await Operator approval at L0â€“L2. Reports auto-send at L3 (Autonomous).
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={loadReports} disabled={reportsLoading}>
                {reportsLoading ? "Refreshingâ€¦" : "Refresh"}
              </Button>
            </div>
            <div className="max-h-[640px] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-card">
                  <TableRow>
                    <TableHead>Sponsor</TableHead>
                    <TableHead className="text-right">Cycle Total</TableHead>
                    <TableHead className="text-right">Next Pkg</TableHead>
                    <TableHead>Autonomy</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>When</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground">No flywheel reports yet.</TableCell></TableRow>
                  ) : reports.map((r) => {
                    const tone =
                      r.status === "sent" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                      : r.status === "pending_review" ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                      : r.status === "failed" ? "bg-destructive/15 text-destructive"
                      : "bg-muted text-muted-foreground";
                    const canApprove = r.status === "draft" || r.status === "pending_review" || r.status === "approved";
                    return (
                      <TableRow key={r.id}>
                        <TableCell>
                          <div className="font-mono text-xs">{r.sponsor_user_id.slice(0, 8)}â€¦</div>
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">pkg {r.package_signature.slice(0, 10)}â€¦</div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-xs">{fmtMoney(r.package_total, r.currency)}</TableCell>
                        <TableCell className="text-right tabular-nums text-xs">{fmtMoney(Number(r.next_package?.total ?? 0), r.currency)}</TableCell>
                        <TableCell className="text-xs">L{r.autonomy_level} Â· {AUTONOMY_LABELS[r.autonomy_level] ?? "?"}</TableCell>
                        <TableCell><Badge className={tone}>{r.status}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {r.sent_at ? `sent ${timeAgo(r.sent_at)}` : `drafted ${timeAgo(r.created_at)}`}
                        </TableCell>
                        <TableCell className="text-right">
                          {r.status === "sent" ? (
                            <span className="text-xs text-emerald-600 dark:text-emerald-400">Auto-sent</span>
                          ) : canApprove ? (
                            <Button size="sm" variant="outline" disabled={approvingId === r.id} onClick={() => handleApproveReport(r.id)}>
                              {approvingId === r.id ? "Sendingâ€¦" : "Approve & send"}
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">â€”</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="autonomy" className="mt-4">
          <Card className="p-0">
            <div className="flex items-center justify-between border-b p-4">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Autonomy levers</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  0 Manual Â· 1 Suggest Â· 2 Assisted Â· 3 Autonomous. Changes apply instantly.
                </p>
              </div>
              <Badge variant="outline">{modules.length} modules</Badge>
            </div>
            <div className="divide-y">
              {modules.length === 0 ? (
                <div className="p-6 text-sm text-muted-foreground">No modules configured.</div>
              ) : modules.map((m) => (
                <div key={m.id} className="grid grid-cols-1 items-center gap-4 p-4 sm:grid-cols-[1fr_auto_2fr_auto]">
                  <div>
                    <div className="font-mono text-sm">{m.module_key}</div>
                    <div className="text-xs text-muted-foreground">
                      {m.country_code ? `Country: ${m.country_code}` : "All countries"} Â· updated {timeAgo(m.updated_at)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={m.enabled}
                      onCheckedChange={(v) => updateModule(m.id, { enabled: v })}
                    />
                    <span className="text-xs text-muted-foreground">{m.enabled ? "Enabled" : "Disabled"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[m.autonomy_level]}
                      min={0}
                      max={3}
                      step={1}
                      onValueChange={(v) => setModules((prev) => prev.map((x) => x.id === m.id ? { ...x, autonomy_level: v[0] } : x))}
                      onValueCommit={(v) => updateModule(m.id, { autonomy_level: v[0] })}
                      className="max-w-xs"
                    />
                    <Badge variant="outline" className="min-w-[110px] justify-center">
                      L{m.autonomy_level} Â· {AUTONOMY_LABELS[m.autonomy_level]}
                    </Badge>
                  </div>
                  <div />
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


