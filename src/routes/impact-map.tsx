import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { BlessingLifecycle } from "@/components/blessing/BlessingLifecycle";
import { getImpactMapData, getLifecycleCounts, type LifecycleCounts } from "@/lib/gateway";
import { useLifecycleRealtime } from "@/hooks/useLifecycleRealtime";

export const Route = createFileRoute("/impact-map")({
  head: () => ({
    meta: [
      { title: "Impact Map — MyBlessings" },
      { name: "description", content: "See where blessings are landing across the world." },
    ],
  }),
  component: ImpactMapPage,
});

type ImpactData = Awaited<ReturnType<typeof getImpactMapData>>;

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function ImpactMapPage() {
  const fetchImpact = useServerFn(getImpactMapData);
  const fetchCounts = useServerFn(getLifecycleCounts);
  const [data, setData] = useState<ImpactData | null>(null);
  const [counts, setCounts] = useState<LifecycleCounts | null>(null);

  const refresh = useCallback(async () => {
    const [d, c] = await Promise.all([fetchImpact(), fetchCounts()]);
    setData(d); setCounts(c);
  }, [fetchImpact, fetchCounts]);
  useEffect(() => { refresh(); }, [refresh]);
  useLifecycleRealtime(refresh);

  const max = Math.max(1, ...(data?.regions.map((r) => r.raised) ?? [1]));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="text-display text-2xl font-semibold sm:text-3xl text-primary-foreground">Impact Map</h1>
      <p className="mt-1 text-sm text-primary-foreground/75">Where blessings are landing, by region.</p>
      {counts && <div className="mt-8"><BlessingLifecycle counts={counts} compact /></div>}
      <Card className="mt-8 p-6">
        {data && data.regions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-black">No regional impact data yet.</p>
        ) : (
          <ul className="space-y-3">
            {data?.regions.map((r) => (
              <li key={r.location}>
                <div className="flex items-center justify-between text-sm">
                  <span className="inline-flex items-center gap-2 font-medium">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {r.location}
                  </span>
                  <span className="text-muted-foreground">{fmt(r.raised)} · {r.donors} blessings · {r.count} campaigns</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${Math.round((r.raised / max) * 100)}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}


