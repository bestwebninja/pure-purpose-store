import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, ArrowRight } from "lucide-react";
import { listCampaigns, type Campaign } from "@/server/campaigns.functions";
import { CampaignCard } from "@/components/blessing/CampaignCard";
import { useCampaignsRealtime } from "@/hooks/useCampaignRealtime";

export const Route = createFileRoute("/give")({
  head: () => ({
    meta: [
      { title: "Give a Blessing — MyBlessings" },
      { name: "description", content: "Choose a blessing to support. Every dollar goes to real people, transparently." },
      { property: "og:title", content: "Give a Blessing — MyBlessings" },
      { property: "og:description", content: "Choose a blessing to support. Every dollar goes to real people, transparently." },
      { property: "og:url", content: "https://pure-purpose-store.lovable.app/give" },
    ],
    links: [{ rel: "canonical", href: "https://pure-purpose-store.lovable.app/give" }],
  }),
  loader: () => listCampaigns(),
  component: GivePage,
});

function GivePage() {
  const { campaigns } = Route.useLoaderData();
  const live = useCampaignsRealtime<Campaign>(campaigns as Campaign[]);

  return (
    <div>
      <section className="bg-gradient-hero">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center text-slate-200">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/60 px-3 py-1 font-medium bg-white text-lg text-blue-600">
            <Heart className="h-3 w-3 text-accent" fill="currentColor" /> Give in under a minute
          </span>
          <h1 className="text-display mt-6 text-4xl font-semibold md:text-6xl text-yellow-400">Choose your blessing.</h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground text-slate-200">
            Pick a story that moves you. Choose your amount. Checkout securely with Shopify. Watch
            the progress update live as the community shows up.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        {live.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border/80 bg-secondary/30 p-12 text-center">
            <h3 className="text-display text-xl font-semibold">No blessings available yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">New campaigns are added regularly — please check back soon.</p>
            <Link to="/" className="mt-6 inline-flex items-center text-primary hover:underline">
              Back to home <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {live.map((c) => <CampaignCard key={c.id} campaign={c} />)}
          </div>
        )}
      </section>
    </div>
  );
}