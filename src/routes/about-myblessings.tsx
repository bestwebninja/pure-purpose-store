import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Sparkles, HandHeart, Globe, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InspirationQuote } from "@/components/site/InspirationQuote";

export const Route = createFileRoute("/about-myblessings")({
  head: () => ({
    meta: [
      { title: "About MyBlessings" },
      { name: "description", content: "A world where kindness finds its way to the right person — instantly." },
      { property: "og:title", content: "About MyBlessings" },
      { property: "og:description", content: "Real people helping real people. No noise. Just connection." },
    ],
  }),
  component: AboutMyBlessings,
});

function Section({ tone, title, children }: { tone: string; title: string; children: React.ReactNode }) {
  return (
    <Card className="p-6">
      <div className="text-sm font-semibold uppercase tracking-wide" style={{ color: tone }}>{title}</div>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </Card>
  );
}

function AboutMyBlessings() {
  return (
    <div>
      <section style={{ backgroundColor: "#0a1f6b", color: "#ffffff" }}>
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium">
            <Heart className="h-3 w-3" fill="currentColor" /> About MyBlessings
          </span>
          <h1 className="text-display mt-6 text-4xl font-semibold md:text-6xl">
            A world where kindness finds its way to the right person — instantly.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/85">
            MyBlessings connects people who want to help with people who need support —
            in a way that feels human, simple, and immediate.
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-base text-white/70">
            No complexity. No barriers. Just real people helping real people.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16 space-y-6">
        <Section tone="#16a34a" title="What We Do">
          <p>We help kindness travel faster.</p>
          <p>When someone asks for help, and someone else wants to give — we quietly bring them together.</p>
          <p>We look at where people are, what they need, and what support is available. Then we make meaningful connections happen.</p>
        </Section>

        <Section tone="#2563eb" title="How It Works">
          <ol className="list-decimal space-y-1 pl-5">
            <li>Someone shares a need</li>
            <li>Someone else offers support</li>
            <li>We gently match them</li>
            <li>Support becomes real impact</li>
          </ol>
          <p>That's it. No noise. No friction. Just connection.</p>
        </Section>

        <Section tone="#7c3aed" title="Our Belief">
          <ul className="list-disc space-y-1 pl-5">
            <li>Kindness is everywhere</li>
            <li>Most people want to help</li>
            <li>Distance should not block generosity</li>
            <li>Technology should serve humanity, not replace it</li>
          </ul>
        </Section>

        <Section tone="#ea580c" title="Why This Is Different">
          <p>We are not a donation platform. We are not a charity directory.</p>
          <p>We are a connection system for human support — meaning faster help, more personal impact, less waste, more dignity.</p>
        </Section>

        <Section tone="#dc2626" title="Global Vision">
          <p>MyBlessings is designed to grow into a worldwide network where:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>anyone can ask for help</li>
            <li>anyone can give support</li>
            <li>geography becomes irrelevant</li>
            <li>kindness becomes structured, not random</li>
          </ul>
        </Section>

        <Card className="p-8 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-primary" />
          <p className="mt-4 text-lg font-medium">
            If you've ever wanted to help someone but didn't know how — you already belong here.
          </p>
        </Card>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16 text-center">
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="bg-yellow-300 text-[#0a1f6b] hover:bg-yellow-400">
            <Link to="/give-a-blessing"><HandHeart className="mr-2 h-4 w-4" /> Give a Blessing 🙏</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/request-help"><Compass className="mr-2 h-4 w-4" /> Request Help 🤝</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/ngo"><Globe className="mr-2 h-4 w-4" /> Become a Partner 🌍</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 pb-20">
        <InspirationQuote variant="banner" />
      </section>
    </div>
  );
}