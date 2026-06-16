import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CampaignCard } from "@/components/blessing/CampaignCard";
import { Card } from "@/components/ui/card";
import { BlessingLifecycle } from "@/components/blessing/BlessingLifecycle";
import { getMarketplaceFeed, getLifecycleCounts, type LifecycleCounts } from "@/lib/gateway";
import { useLifecycleRealtime } from "@/hooks/useLifecycleRealtime";

export const Route = createFileRoute("/marketplace")({
  head: () => ({
    meta: [
      { title: "Campaigns � MyBlessings" },
      { name: "description", content: "Browse active campaigns and choose who to support." },
      { property: "og:title", content: "Campaigns � MyBlessings" },
      { property: "og:description", content: "Browse active campaigns and choose who to support." },
      { property: "og:url", content: "https://pure-purpose-store.lovable.app/marketplace" },
    ],
    links: [{ rel: "canonical", href: "https://pure-purpose-store.lovable.app/marketplace" }],
  }),
  component: MarketplacePage,
});

type Feed = Awaited<ReturnType<typeof getMarketplaceFeed>>;

function MarketplacePage() {
  const fetchFeed = useServerFn(getMarketplaceFeed);
  const fetchCounts = useServerFn(getLifecycleCounts);
  const [feed, setFeed] = useState<Feed | null>(null);
  const [counts, setCounts] = useState<LifecycleCounts | null>(null);

  const refresh = useCallback(async () => {
    const [f, c] = await Promise.all([fetchFeed(), fetchCounts()]);
    setFeed(f); setCounts(c);
  }, [fetchFeed, fetchCounts]);

  useEffect(() => { refresh(); }, [refresh]);
  useLifecycleRealtime(refresh);

  return (
<<<<<<< HEAD
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="text-display text-2xl font-semibold text-foreground sm:text-3xl">Campaigns</h1>
      <p className="mt-1 text-sm text-muted-foreground">Every blessing matters. Pick one to support.</p>
      {counts && <div className="mt-8"><BlessingLifecycle counts={counts} compact /></div>}
      {feed && feed.campaigns.length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">No active blessings yet � check back soon.</p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {feed?.campaigns.map((c) => <CampaignCard key={c.id} campaign={c as never} />)}
        </div>
      )}
=======
    <div className="relative min-h-screen overflow-hidden bg-shell-navy text-primary-foreground">
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-secondary/20 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute bottom-0 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-accent/15 blur-3xl" />
      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <header className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent">Impact Ecosystem</p>
          <h1 className="mt-3 text-display text-4xl font-normal tracking-tight text-primary-foreground md:text-5xl">Campaigns</h1>
          <p className="mt-2 max-w-2xl text-sm text-primary-foreground/70">Every blessing matters. Pick one to support.</p>
        </header>
        {counts && <div className="mb-8"><BlessingLifecycle counts={counts} compact /></div>}
        {feed && feed.campaigns.length === 0 ? (
          <Card className="border-primary-foreground/15 bg-primary-foreground/5 p-10 text-center text-primary-foreground">
            <h2 className="text-display text-lg font-semibold">No active blessings yet</h2>
            <p className="mt-2 text-sm text-primary-foreground/70">Check back soon — new campaigns appear here as they go live.</p>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {feed?.campaigns.map((c) => <CampaignCard key={c.id} campaign={c as never} />)}
          </div>
        )}
      </div>
>>>>>>> 0fda86d7ee521118278c9b3c1a384b9a6a990537
    </div>
  );
}


