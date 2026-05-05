import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Search, Sparkles, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How It Works — MyBlessings" },
      { name: "description", content: "Discover, give, and witness. Three steps to turning generosity into impact." },
      { property: "og:title", content: "How It Works — MyBlessings" },
      { property: "og:description", content: "Three simple steps to give a blessing." },
    ],
  }),
  component: HowItWorks,
});

const STEPS = [
  { icon: Search, title: "Discover a Blessing", body: "Browse real, verified stories from people in moments that matter." },
  { icon: Heart, title: "Give Securely", body: "Choose your amount and check out securely with Shopify. Every dollar tracked in real time." },
  { icon: Sparkles, title: "Witness the Impact", body: "Watch the campaign grow live. Read updates from the people you helped." },
];

function HowItWorks() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-20">
      <header className="text-center">
        <h1 className="text-display text-4xl font-semibold md:text-6xl">How MyBlessings works</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          We've stripped giving down to its essentials. No noise. No friction. Just three steps
          between you and a meaningful blessing.
        </p>
      </header>
      <div className="mt-16 grid gap-6 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <div key={s.title} className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
                <s.icon className="h-5 w-5" />
              </span>
              <span className="text-sm font-medium text-muted-foreground">Step {i + 1}</span>
            </div>
            <h3 className="text-display mt-4 text-xl font-semibold">{s.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
          </div>
        ))}
      </div>
      <div className="mt-16 rounded-3xl bg-gradient-warm p-10 text-center">
        <ShieldCheck className="mx-auto h-8 w-8 text-primary" />
        <h2 className="text-display mt-4 text-2xl font-semibold">Built for trust</h2>
        <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
          Payments are processed by Shopify. Campaign progress updates live from our backend. You
          can always see where your blessing went.
        </p>
        <Button asChild className="mt-6 bg-gradient-primary text-primary-foreground shadow-soft hover:opacity-95">
          <Link to="/give">Give a Blessing</Link>
        </Button>
      </div>
    </div>
  );
}