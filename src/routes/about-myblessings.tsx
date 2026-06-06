import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Sparkles, HandHeart, Globe, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InspirationQuote } from "@/components/site/InspirationQuote";

export const Route = createFileRoute("/about-myblessings")({
  head: () => ({
    meta: [
      { title: "About MyBlessings" },
      { name: "description", content: "A world where kindness finds its way to the right person, instantly." },
      { property: "og:title", content: "About MyBlessings" },
      { property: "og:description", content: "Real people helping real people. No noise. Just connection." },
      { property: "og:url", content: "https://pure-purpose-store.lovable.app/about-myblessings" },
    ],
    links: [{ rel: "canonical", href: "https://pure-purpose-store.lovable.app/about-myblessings" }],
  }),
  component: AboutMyBlessings,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-display text-2xl font-semibold uppercase tracking-wide text-accent">{title}</div>
      <div className="mt-3 space-y-3 text-base leading-relaxed text-primary-foreground/90">{children}</div>
    </div>
  );
}

function AboutMyBlessings() {
  return (
    <div className="bg-primary text-primary-foreground">
      <section>
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium">
            <Heart className="h-3 w-3" fill="currentColor" /> About MyBlessings
          </span>
          <h1 className="text-display mt-6 text-4xl font-semibold md:text-6xl">
            A world where kindness finds its way to the right person, instantly.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-primary-foreground/85">
            MyBlessings connects people who want to help with people who need support,
            in a way that feels human, simple, and immediate.
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-xl text-primary-foreground/70">
            No complexity. No barriers. Just real people helping real people.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-12 space-y-8">
        <Section title="What We Do">
          <p>We help kindness travel faster.</p>
          <p>When someone asks for help, and someone else wants to give, we quietly bring them together.</p>
          <p>We look at where people are, what they need, and what support is available. Then we make meaningful connections happen.</p>
        </Section>

        <Section title="How It Works">
          <ol className="list-decimal space-y-1 pl-5">
            <li>Someone shares a need</li>
            <li>Someone else offers support</li>
            <li>We gently match them</li>
            <li>Support becomes real impact</li>
          </ol>
          <p>That is it. No noise. No friction. Just connection.</p>
        </Section>

        <Section title="Our Belief">
          <ul className="list-disc space-y-1 pl-5">
            <li>Kindness is everywhere</li>
            <li>Most people want to help</li>
            <li>Distance should not block generosity</li>
            <li>Technology should serve humanity, not replace it</li>
          </ul>
        </Section>

        <Section title="Why This Is Different">
          <p>We are not a donation platform. We are not a charity directory.</p>
          <p>We are a connection system for human support, meaning faster help, more personal impact, less waste, more dignity.</p>
        </Section>

        <Section title="Global Vision">
          <p>MyBlessings is designed to grow into a worldwide network where:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Geography becomes irrelevant</li>
            <li>Anyone can give support</li>
            <li>Kindness becomes structured, not random</li>
          </ul>
        </Section>

        <div className="rounded-lg border border-white/15 bg-white/5 p-8 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-accent" />
          <p className="mt-4 text-lg font-medium text-primary-foreground">
            If you have ever wanted to help someone but did not know how, you already belong here.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16 text-center">
        <div className="flex flex-col items-center justify-center gap-3">
          <Button asChild size="lg" className="w-full max-w-xs bg-accent text-accent-foreground hover:bg-accent/90">
            <Link to="/give-a-blessing"><HandHeart className="mr-2 h-4 w-4" /> Give a Blessing 🙏</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="w-full max-w-xs border-white/40 bg-white/10 text-primary-foreground hover:bg-white/20">
            <Link to="/request-help"><Compass className="mr-2 h-4 w-4" /> BlessME</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="w-full max-w-xs border-white/40 bg-white/10 text-primary-foreground hover:bg-white/20">
            <Link to="/ngo"><Globe className="mr-2 h-4 w-4" /> Become a Partner </Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 pb-20">
        <InspirationQuote variant="banner" />
      </section>
    </div>
  );
}
