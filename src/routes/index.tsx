import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Heart, ShieldCheck, ArrowRight, Globe2, Eye, HandHeart, Quote } from "lucide-react";
import heroImage from "@/assets/hero-blessings.jpg";
import { listCampaigns, type Campaign } from "@/server/campaigns.functions";
import { CampaignCard } from "@/components/blessing/CampaignCard";
import { useCampaignsRealtime } from "@/hooks/useCampaignRealtime";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Home — MyBlessings · Give With Purpose" },
      { name: "description", content: "When humanity shows up for one another, blessings happen. Support real people and real causes — transparently." },
      { property: "og:title", content: "MyBlessings — Give With Purpose" },
      { property: "og:description", content: "Support real people and real causes — transparently." },
      { property: "og:url", content: "https://pure-purpose-store.lovable.app/" },
      { property: "og:image", content: `https://pure-purpose-store.lovable.app${heroImage}` },
      { property: "og:image:alt", content: "MyBlessings — give with purpose" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: `https://pure-purpose-store.lovable.app${heroImage}` },
    ],
    links: [
      { rel: "canonical", href: "https://pure-purpose-store.lovable.app/" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "MyBlessings",
          url: "https://pure-purpose-store.lovable.app",
          potentialAction: {
            "@type": "SearchAction",
            target: "https://pure-purpose-store.lovable.app/explore-blessings?q={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        }),
      },
    ],
  }),
  loader: () => listCampaigns(),
  component: Index,
});

function Index() {
  const { campaigns } = Route.useLoaderData();
  const live = useCampaignsRealtime<Campaign>(campaigns as Campaign[]);

  return (
    <div className="bg-background">
      <Hero />
      <ImpactStrip campaigns={live} />
      <CampaignGrid campaigns={live} />
      <Trust />
      <Testimony />
      <CTA />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-hero text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-accent/30 blur-3xl" aria-hidden />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-24 md:grid-cols-[1.1fr_1fr] md:py-32">
        <div className="space-y-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" /> A trust-first giving institution
          </span>
          <h1 className="text-display text-5xl font-normal leading-[1.02] tracking-tight md:text-7xl">
            Give with purpose.
            <br />
            <span className="italic text-accent">Receive blessings.</span>
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-white/80">
            MyBlessings is a transparent giving platform where every dollar is tracked,
            every story is verified, and every recipient is honored. Built on accountability,
            and Ai algorithms.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-md bg-accent px-8 text-base font-semibold text-primary shadow-glow hover:bg-accent/90"
            >
              <Link to="/give">
                <Heart className="mr-2 h-4 w-4" fill="currentColor" /> Give a blessing
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="ghost"
              className="h-12 rounded-md px-4 text-base font-medium text-white/80 hover:bg-transparent hover:text-white"
            >
              <Link to="/how-it-works">
                How it works <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-4 text-xs uppercase tracking-[0.15em] text-green-500">
            <span className="inline-flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-accent" /> 100% transparent ledger</span>
            <span className="text-white/30">·</span>
            <span>Secure Shopify checkout</span>
            <span className="text-white/30">·</span>
            <span>Verified recipients</span>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-4 rounded-[2rem] bg-accent/30 blur-2xl" aria-hidden />
          <div className="relative overflow-hidden rounded-[1.5rem] border border-white/10 shadow-card">
            <img
              src={heroImage}
              alt="Hands joined in support"
              className="w-full object-cover"
              loading="eager"
              fetchPriority="high"
              width={1200}
              height={900}
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-primary/90 to-transparent p-6">
              <p className="text-display text-lg italic text-white">
                "Charity is the best deposit account."
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-accent">— founding principle</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ImpactStrip({ campaigns }: { campaigns: Campaign[] }) {
  const totalRaised = campaigns.reduce((sum, c) => sum + Number(c.raised_amount ?? 0), 0);
  const totalDonors = campaigns.reduce((sum, c) => sum + (c.donor_count ?? 0), 0);
  const liveCampaigns = campaigns.length;

  const stats = [
    { label: "Raised across all blessings", value: formatUSD(totalRaised) },
    { label: "Donors who showed up", value: totalDonors.toLocaleString() },
    { label: "Active blessings", value: liveCampaigns.toLocaleString() },
    { label: "Every Blessing sent reaches the Blessed, given with your kindness", value: "100%" },
  ];

  return (
    <section className="border-y border-border bg-secondary">
      <div className="mx-auto grid max-w-7xl gap-px overflow-hidden bg-border sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-secondary px-6 py-8">
            <div className="text-display text-3xl text-primary md:text-4xl">{s.value}</div>
            <div className="mt-2 text-xs uppercase tracking-[0.15em] text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CampaignGrid({ campaigns }: { campaigns: Awaited<ReturnType<typeof listCampaigns>>["campaigns"] }) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <div className="mb-12 flex flex-col gap-6 border-l-4 border-accent pl-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Live now</p>
          <h2 className="text-display mt-2 text-4xl text-primary md:text-5xl">Active blessings</h2>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Each story is reviewed, each ledger is public, each recipient is named with their consent.
          </p>
        </div>
        <Link
          to="/explore-blessings"
          className="group inline-flex w-fit items-center gap-2 text-sm font-semibold uppercase tracking-[0.15em] text-primary hover:text-primary-glow"
        >
          Explore all
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-secondary/40 p-16 text-center">
          <h3 className="text-display text-2xl text-primary">No blessings live just yet</h3>
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
    {
      icon: Eye,
      title: "Every dollar tracked",
      body: "A public ledger records every contribution and disbursement. No hidden fees, no skim, no opacity.",
    },
    {
      icon: ShieldCheck,
      title: "Stories verified",
      body: "Every campaign is reviewed against documentation and partner NGOs before going live.",
    },
    {
      icon: HandHeart,
      title: "Recipients honored",
      body: "Beneficiaries publish updates back to the page so the impact keeps unfolding.",
    },
    {
      icon: Globe2,
      title: "Global, local both",
      body: "From a hospital bill in Lagos to a furnace in Detroit, your blessing crosses borders cleanly.",
    },
  ];
  return (
    <section className="bg-primary py-24 text-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-14 max-w-2xl">
          <p className="text-xs uppercase tracking-[0.2em] text-accent">Our standard</p>
          <h2 className="text-display mt-3 text-4xl md:text-5xl">Built on trust,<br/>not transactions.</h2>
        </div>
        <div className="grid gap-px overflow-hidden rounded-2xl bg-white/10 md:grid-cols-2 lg:grid-cols-4">
          {items.map((it) => (
            <div key={it.title} className="bg-primary p-8 transition-colors hover:bg-primary-glow/40">
              <it.icon className="h-7 w-7 text-accent" />
              <h3 className="text-display mt-6 text-xl">{it.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/70">{it.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimony() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-24">
      <div className="rounded-3xl border border-border bg-accent-soft p-10 md:p-16">
        <Quote className="h-10 w-10 text-primary" />
        <p className="text-display mt-6 text-2xl leading-snug text-primary md:text-4xl">
          "I didn't expect strangers to carry me through the worst week of my life.
          MyBlessings made it feel less like charity and more like community."
        </p>
        <div className="mt-8 flex items-center gap-3 text-sm">
          <div className="h-10 w-10 rounded-full text-center text-base font-semibold leading-10 text-accent bg-red-500">A</div>
          <div>
            <div className="font-semibold text-primary uppercase">FOR ALL GIVERS AND RECIPIENTS</div>
            <div className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Recipient · Healthcare</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="relative overflow-hidden bg-gradient-hero py-24 text-white">
      <div className="absolute -bottom-40 left-1/2 h-96 w-[60rem] -translate-x-1/2 rounded-full bg-accent/20 blur-3xl" aria-hidden />
      <div className="relative mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-[1.5fr_1fr] md:items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-accent">Take a minute</p>
          <h2 className="text-display mt-3 text-4xl leading-[1.05] md:text-6xl">
            One blessing<br/>can change a life.
          </h2>
          <p className="mt-5 max-w-xl text-white/75">
            Join the donors, recipients, and partner NGOs building a transparent giving institution
            from the ground up.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Button
            asChild
            size="lg"
            className="h-14 rounded-md bg-accent text-base font-semibold text-primary shadow-glow hover:bg-accent/90"
          >
            <Link to="/give"><Heart className="mr-2 h-5 w-5" fill="currentColor" /> Give a blessing</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-14 rounded-md border-white/40 bg-transparent text-base font-medium text-white hover:bg-white/10 hover:text-white"
          >
            <Link to="/become-blessing-sponsor">Become a sponsor</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function formatUSD(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${Math.round(n).toLocaleString()}`;
}
