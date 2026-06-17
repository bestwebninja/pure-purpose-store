import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Search, Sparkles, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How It Works — MyBlessings" },
      {
        name: "description",
        content:
          "Discover, give, and witness. Three steps to turning generosity into impact.",
      },
      { property: "og:title", content: "How It Works — MyBlessings" },
      {
        property: "og:description",
        content: "Three simple steps to give a blessing.",
      },
      {
        property: "og:url",
        content: "https://pure-purpose-store.lovable.app/how-it-works",
      },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://pure-purpose-store.lovable.app/how-it-works",
      },
    ],
  }),
  component: HowItWorks,
});

const STEPS = [
  {
    icon: Search,
    title: "Discover a Blessing",
    body: "Browse real, verified stories from people in moments that matter.",
  },
  {
    icon: Heart,
    title: "Give Securely",
    body: "Choose your amount and check out securely with Shopify. Every dollar tracked in real time.",
  },
  {
    icon: Sparkles,
    title: "Witness the Impact",
    body: "Watch the campaign grow live. Read updates from the people you helped.",
  },
];

function HowItWorks() {
  return (
    <div className="surface-page mx-auto max-w-5xl px-6 py-20 text-foreground">
      {/* HEADER */}
      <header className="text-center">
        <h1 className="text-display text-5xl font-semibold md:text-6xl">
          How You Give a Blessing
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          We’ve built a simple three-step system to turn generosity into real
          impact.
        </p>
      </header>

      {/* STEPS */}
      <div className="mt-16 grid gap-6 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <div key={s.title} className="surface-card p-6">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-muted text-foreground">
                <s.icon className="h-5 w-5" />
              </span>

              <span className="text-sm font-medium text-muted-foreground">
                Step {i + 1}
              </span>
            </div>

            <h3 className="text-display mt-4 text-xl font-semibold text-foreground">
              {s.title}
            </h3>

            <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
          </div>
        ))}
      </div>

      {/* CTA BLOCK */}
      <div className="surface-card mt-16 rounded-3xl p-10 text-center">
        <ShieldCheck className="mx-auto h-8 w-8 text-foreground" />

        <h2 className="text-display mt-4 text-2xl font-semibold">
          Built for trust
        </h2>

        <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
          Payments are processed securely. Every blessing is tracked and
          verified in real time.
        </p>

        <Button
          asChild
          size="lg"
          className="mt-6 font-blessing text-2xl shadow-blessing-glow"
        >
          <Link to="/give-a-blessing">Give a Blessing</Link>
        </Button>
      </div>
    </div>
  );
}