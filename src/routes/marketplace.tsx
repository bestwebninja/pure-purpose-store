import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CampaignCard } from "@/components/blessing/CampaignCard";
import { BlessingLifecycle } from "@/components/blessing/BlessingLifecycle";
import { getMarketplaceFeed, getLifecycleCounts, type LifecycleCounts } from "@/lib/gateway";
import { useLifecycleRealtime } from "@/hooks/useLifecycleRealtime";

export const Route = createFileRoute("/marketplace")({
  head: () => ({
    meta: [
      { title: "Marketplace — MyBlessings" },
      { name: "description", content: "Browse active blessings and choose who to support." },
      { property: "og:title", content: "Marketplace — MyBlessings" },
      { property: "og:description", content: "Browse active blessings and choose who to support." },
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
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="text-display text-2xl font-semibold sm:text-3xl">Marketplace</h1>
      <p className="mt-1 text-sm text-muted-foreground text-white">Every blessing matters. Pick one to support.</p>
      {counts && <div className="mt-8"><BlessingLifecycle counts={counts} compact /></div>}
      {feed && feed.campaigns.length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground text-white">No active blessings yet — check back soon.</p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {feed?.campaigns.map((c) => <CampaignCard key={c.id} campaign={c as never} />)}
        </div>
      )}
    </div>
  );
}


