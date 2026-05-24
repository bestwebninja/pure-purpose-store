import { createFileRoute, Link, Outlet, useChildMatches } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BlessingLifecycle } from "@/components/blessing/BlessingLifecycle";
import { BlessingPaymentForm } from "@/components/blessing/BlessingPaymentForm";
import { getLifecycleCounts, type LifecycleCounts } from "@/server/api/gateway";
import { useLifecycleRealtime } from "@/hooks/useLifecycleRealtime";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — MyBlessings" },
      { name: "description", content: "Your live view of the blessing lifecycle." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const fetchCounts = useServerFn(getLifecycleCounts);
  const [counts, setCounts] = useState<LifecycleCounts | null>(null);
  const refresh = useCallback(async () => {
    try { setCounts(await fetchCounts()); } catch { /* ignore */ }
  }, [fetchCounts]);
  useEffect(() => { refresh(); }, [refresh]);
  useLifecycleRealtime(refresh);

  // When a nested route (e.g. /dashboard/petri-graph) is active, render only the child.
  if (useChildMatches().length > 0) return <Outlet />;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-display text-2xl font-semibold sm:text-3xl">Your Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground text-white">Live blessing activity, updated in real time.</p>
        </div>
        <Button asChild variant="outline" size="sm"><Link to="/marketplace">Browse Marketplace</Link></Button>
      </div>
      <div className="mt-8 space-y-6">
        {counts && <BlessingLifecycle counts={counts} />}
        <div className="grid gap-6 md:grid-cols-2">
          <BlessingPaymentForm />
          <Card className="p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground text-slate-50">Quick links</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link to="/marketplace" className="underline">Marketplace</Link></li>
              <li><Link to="/impact-map" className="underline">Impact Map</Link></li>
              <li><Link to="/admin/command-center" className="underline">Command Center</Link></li>
              <li><Link to="/me/giving" className="underline">My giving history</Link></li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}


