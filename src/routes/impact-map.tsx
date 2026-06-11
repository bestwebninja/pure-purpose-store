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
      <Card className="mt-8 p-6 border-primary-foreground/15 bg-primary-foreground/5 text-primary-foreground">
        {data && data.regions.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <MapPin className="h-8 w-8 text-primary-foreground/40" />
            <p className="text-sm text-primary-foreground/70">No regional impact data yet for the United States or Israel.</p>
            <p className="text-xs text-primary-foreground/50">Once blessings land, they will appear here.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {data?.regions.map((r) => (
              <li key={r.location}>
                <div className="flex items-center justify-between text-sm">
                  <span className="inline-flex items-center gap-2 font-medium">
                    <MapPin className="h-4 w-4 text-primary-foreground/60" />
                    {r.location}
                  </span>
                  <span className="text-primary-foreground/70">{fmt(r.raised)} · {r.donors} blessings · {r.count} campaigns</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-primary-foreground/10">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${Math.round((r.raised / max) * 100)}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}


