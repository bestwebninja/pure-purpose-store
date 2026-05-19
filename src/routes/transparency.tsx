import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, BarChart3, Eye } from "lucide-react";
import { getPublicStats } from "@/server/stats.functions";

export const Route = createFileRoute("/transparency")({
  head: () => ({
    meta: [
      { title: "Transparency â€” MyBlessings" },
      { name: "description", content: "Every blessing tracked. Every dollar accounted for. See how we keep MyBlessings honest." },
      { property: "og:title", content: "Transparency â€” MyBlessings" },
      { property: "og:description", content: "Every blessing tracked, every dollar accounted for." },
      { property: "og:url", content: "https://pure-purpose-store.lovable.app/transparency" },
    ],
    links: [{ rel: "canonical", href: "https://pure-purpose-store.lovable.app/transparency" }],
  }),
  loader: () => getPublicStats(),
  component: Transparency,
});

function Transparency() {
  const stats = Route.useLoaderData();
  return (
    <div className="mx-auto max-w-5xl px-6 py-20">
      <header>
        <h1 className="text-display text-4xl font-semibold md:text-6xl">Transparency by default.</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Trust isn't a marketing claim â€” it's a workflow. Here's exactly how we account for every
          blessing on the platform.
        </p>
      </header>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Total raised</div>
          <div className="mt-1 text-3xl font-semibold">${stats.totalRaised.toFixed(2)}</div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Donations</div>
          <div className="mt-1 text-3xl font-semibold">{stats.donationsCount}</div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Unique donors</div>
          <div className="mt-1 text-3xl font-semibold">{stats.uniqueDonors}</div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Active blessings</div>
          <div className="mt-1 text-3xl font-semibold">{stats.campaignsActive}</div>
        </div>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {[
          { icon: BarChart3, title: "Live progress", body: "Every campaign's raised total updates in real time as donations clear." },
          { icon: Eye, title: "Public donor history", body: "Every blessing â€” anonymous or not â€” is publicly listed on the campaign page." },
          { icon: ShieldCheck, title: "Secure checkout", body: "Payments go through Shopify's hosted checkout. We never touch card data." },
        ].map((it) => (
          <div key={it.title} className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
            <it.icon className="h-6 w-6 text-primary" />
            <h3 className="text-display mt-4 text-lg font-semibold">{it.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{it.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

