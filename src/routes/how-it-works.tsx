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
      { property: "og:url", content: "https://pure-purpose-store.lovable.app/how-it-works" },
    ],
    links: [{ rel: "canonical", href: "https://pure-purpose-store.lovable.app/how-it-works" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "How do I discover a blessing?",
              acceptedAnswer: { "@type": "Answer", text: "Browse real, verified stories from people in moments that matter." },
            },
            {
              "@type": "Question",
              name: "How do I give securely?",
              acceptedAnswer: { "@type": "Answer", text: "Choose your amount and check out securely with Shopify. Every dollar tracked in real time." },
            },
            {
              "@type": "Question",
              name: "How do I witness the impact?",
              acceptedAnswer: { "@type": "Answer", text: "Watch the campaign grow live. Read updates from the people you helped." },
            },
          ],
        }),
      },
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
        <Button
          asChild
          size="lg"
          className="mt-6 text-2xl hover:opacity-95"
          style={{
            backgroundColor: "#1d4ed8",
            color: "#f8f6ee",
            fontFamily: '"Great Vibes", "Snell Roundhand", cursive',
            boxShadow:
              "0 0 20px 4px rgba(125, 200, 255, 0.85), 0 0 44px 10px rgba(255, 230, 120, 0.6), 0 0 72px 14px rgba(255, 215, 0, 0.35)",
          }}
        >
          <Link to="/give-a-blessing">Give a Blessing</Link>
        </Button>
      </div>
    </div>
  );
}

