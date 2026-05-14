import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCommandCenterSnapshot } from "@/server/ngo.functions";
import { getLifecycleCounts, type LifecycleCounts } from "@/lib/dashboard.functions";
import { BlessingLifecycle } from "@/components/blessing/BlessingLifecycle";
import { useLifecycleRealtime } from "@/hooks/useLifecycleRealtime";

export const Route = createFileRoute("/admin/command-center")({
  head: () => ({
    meta: [
      { title: "Command Center — MyBlessings Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CommandCenter,
});

type Snapshot = Awaited<ReturnType<typeof getCommandCenterSnapshot>>;

function Stat({ label, value, tone }: { label: string; value: string | number; tone?: "ok" | "warn" | "bad" }) {
  const color = tone === "bad" ? "text-destructive" : tone === "warn" ? "text-amber-500" : "text-foreground";
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`text-2xl font-semibold ${color}`}>{value}</div>
    </div>
  );
}

function CommandCenter() {
  const fetchSnapshot = useServerFn(getCommandCenterSnapshot);
  const fetchCounts = useServerFn(getLifecycleCounts);
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [counts, setCounts] = useState<LifecycleCounts | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [data, c] = await Promise.all([fetchSnapshot(), fetchCounts()]);
      setSnap(data);
      setCounts(c);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [fetchSnapshot, fetchCounts]);

  useLifecycleRealtime(refresh);

  useEffect(() => {
    refresh();
    const i = setInterval(refresh, 15000);
    return () => clearInterval(i);
  }, [refresh]);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-display text-3xl font-semibold text-white">Command Center</h1>
        <Card className="mt-6 p-6">
          <p className="text-sm text-destructive">{error}</p>
          <p className="mt-2 text-sm text-muted-foreground">Sign in as an admin to view ops data.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-display text-2xl font-semibold sm:text-3xl">Command Center</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Live ops view {snap?.generatedAt ? `· updated ${new Date(snap.generatedAt).toLocaleTimeString()}` : ""}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={refresh} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      {!snap ? (
        <p className="mt-8 text-sm text-muted-foreground">Loading…</p>
      ) : (
        <>
        {counts && <div className="mt-8"><BlessingLifecycle counts={counts} /></div>}
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Donations</h2>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <Stat label="Total raised" value={`$${snap.donations.totalRaised.toFixed(2)}`} />
              <Stat label="Count" value={snap.donations.count} />
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Campaigns</h2>
            <div className="mt-4 flex items-baseline gap-3">
              <Stat label="Total" value={snap.campaigns.total} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {Object.entries(snap.campaigns.byStatus).map(([s, n]) => (
                <Badge key={s} variant="secondary">{s}: {n}</Badge>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">NGO Applications</h2>
            <div className="mt-4 flex items-baseline gap-3">
              <Stat label="Total" value={snap.ngo.total} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {Object.entries(snap.ngo.byStatus).map(([s, n]) => (
                <Badge key={s} variant={s === "ACTIVE" ? "default" : s === "REJECTED" ? "destructive" : "secondary"}>
                  {s}: {n}
                </Badge>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Pipeline</h2>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <Stat label="Webhook events" value={snap.pipeline.webhookEventsSeen} />
              <Stat label="Donations recorded" value={snap.pipeline.donationsRecorded} />
            </div>
            <div className="mt-3">
              <Badge variant={snap.pipeline.shopifyWebhookSecretConfigured ? "default" : "destructive"}>
                Shopify webhook secret: {snap.pipeline.shopifyWebhookSecretConfigured ? "configured" : "missing"}
              </Badge>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Ledger Integrity</h2>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <Stat label="Entries" value={snap.ledger.entries} />
              <Stat label="Donations posted" value={snap.ledger.donationsPosted} />
            </div>
            <div className="mt-3">
              <Badge variant={snap.ledger.balanced ? "default" : "destructive"}>
                {snap.ledger.balanced ? "Balanced (debits = credits)" : `Unbalanced: ${snap.ledger.unbalancedCount}`}
              </Badge>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Health</h2>
            <div className="mt-4 space-y-2 text-sm">
              <a href="/api/public/health" target="_blank" rel="noreferrer" className="block underline">
                /api/public/health
              </a>
              <a href="/api/public/go-live-report" target="_blank" rel="noreferrer" className="block underline">
                /api/public/go-live-report
              </a>
            </div>
          </Card>

          <Card className="p-6 lg:col-span-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Recent donations</h2>
            {snap.recent.donations.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No donations yet.</p>
            ) : (
              <ul className="mt-3 divide-y text-sm">
                {snap.recent.donations.map((d) => (
                  <li key={d.id} className="flex justify-between py-2">
                    <span>{d.donor_name ?? "Anonymous"}</span>
                    <span className="text-muted-foreground">
                      ${Number(d.amount).toFixed(2)} {d.currency} · {new Date(d.created_at).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Recent webhooks</h2>
            {snap.recent.webhooks.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No webhook events yet.</p>
            ) : (
              <ul className="mt-3 divide-y text-sm">
                {snap.recent.webhooks.map((w) => (
                  <li key={w.event_id} className="py-2">
                    <div className="font-medium">{w.topic ?? "(no topic)"}</div>
                    <div className="text-xs text-muted-foreground">
                      {w.source} · {new Date(w.processed_at).toLocaleString()}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
        </>
      )}
    </div>
  );
}