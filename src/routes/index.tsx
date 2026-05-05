import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Heart, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-blessings.jpg";
import { listCampaigns, type Campaign } from "@/server/campaigns.functions";
import { CampaignCard } from "@/components/blessing/CampaignCard";
import { useCampaignsRealtime } from "@/hooks/useCampaignRealtime";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MyBlessings — Give With Purpose" },
      { name: "description", content: "When humanity shows up for one another, blessings happen. Support real people and real causes — transparently." },
      { property: "og:title", content: "MyBlessings — Give With Purpose" },
      { property: "og:description", content: "Support real people and real causes — transparently." },
    ],
  }),
  loader: () => listCampaigns(),
  component: Index,
});

function Index() {
  const { campaigns } = Route.useLoaderData();
  const live = useCampaignsRealtime<Campaign>(campaigns as Campaign[]);

  return (
    <div>
      <Hero />
      <CampaignGrid campaigns={live} />
      <Trust />
      <CTA />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-hero">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-20 md:grid-cols-2 md:py-28">
        <div className="space-y-7">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="h-3 w-3 text-accent" /> A new way to give
          </span>
          <h1 className="text-display text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
            Give With Purpose.
            <br />
            <span className="text-primary">Receive Blessings.</span>
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            When humanity shows up for one another, blessings happen. Support real people facing
            real moments — every dollar tracked, every story honored.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              asChild
              size="lg"
              className="text-2xl hover:opacity-95"
              style={{
                backgroundColor: "#1d4ed8",
                color: "#f8f6ee",
                fontFamily: '"Great Vibes", "Snell Roundhand", cursive',
                boxShadow:
                  "0 0 20px 4px rgba(125, 200, 255, 0.85), 0 0 44px 10px rgba(255, 230, 120, 0.6), 0 0 72px 14px rgba(255, 215, 0, 0.35)",
              }}
            >
              <Link to="/give">
                <Heart className="mr-2 h-4 w-4" fill="currentColor" /> Give a Blessing
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="hover:opacity-95"
              style={{
                backgroundColor: "#7dc8ff",
                color: "#ffd700",
                boxShadow: "none",
              }}
            >
              <Link to="/how-it-works">
                How it works <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="flex items-center gap-6 pt-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-success" /> 100% transparent</span>
            <span>·</span>
            <span>Secure Shopify checkout</span>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-6 rounded-[2rem] bg-gradient-warm blur-2xl opacity-60" aria-hidden />
          <img
            src={heroImage}
            alt="Hands joined in support"
            className="relative w-full rounded-[1.75rem] object-cover shadow-card"
            loading="eager"
          />
        </div>
      </div>
    </section>
  );
}

function CampaignGrid({ campaigns }: { campaigns: Awaited<ReturnType<typeof listCampaigns>>["campaigns"] }) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="mb-10 flex items-end justify-between gap-6">
        <div>
          <h2 className="text-display text-3xl font-semibold md:text-4xl">Active Blessings</h2>
          <p className="mt-2 text-muted-foreground">Real people. Real moments. Choose where your blessing goes.</p>
        </div>
        <Link to="/give" className="hidden text-sm font-medium text-primary hover:underline md:inline-flex">
          Start a blessing →
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border/80 bg-secondary/30 p-12 text-center">
          <h3 className="text-display text-xl font-semibold">No blessings live just yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">Check back soon — new campaigns are added regularly.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((c) => (
            <CampaignCard key={c.id} campaign={c} />
          ))}
        </div>
      )}
    </section>
  );
}

function Trust() {
  const items = [
    { title: "Every dollar tracked", body: "Real-time progress. Public donor history. No hidden fees on top." },
    { title: "Real stories, verified", body: "Every blessing is reviewed before going live so you can give with confidence." },
    { title: "You see the impact", body: "Updates from beneficiaries land back on the page so the story keeps going." },
  ];
  return (
    <section className="bg-secondary/40 py-20">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="text-display max-w-2xl text-3xl font-semibold md:text-4xl">Built on trust, not transactions.</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {items.map((it) => (
            <div key={it.title} className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
              <ShieldCheck className="h-6 w-6 text-primary" />
              <h3 className="text-display mt-4 text-lg font-semibold">{it.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{it.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-20 text-center">
      <h2 className="text-display text-3xl font-semibold md:text-5xl">
        One blessing can change a life.
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
        Join thousands of givers showing up for one another. It takes less than a minute.
      </p>
      <Button
        asChild
        size="lg"
        className="mt-8 text-2xl hover:opacity-95"
        style={{
          backgroundColor: "#1d4ed8",
          color: "#f8f6ee",
          fontFamily: '"Great Vibes", "Snell Roundhand", cursive',
          boxShadow:
            "0 0 20px 4px rgba(125, 200, 255, 0.85), 0 0 44px 10px rgba(255, 230, 120, 0.6), 0 0 72px 14px rgba(255, 215, 0, 0.35)",
        }}
      >
        <Link to="/give"><Heart className="mr-2 h-4 w-4" fill="currentColor" /> Give a Blessing</Link>
      </Button>
    </section>
  );
}
