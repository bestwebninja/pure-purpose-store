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

const garamond = { fontFamily: '"EB Garamond", Garamond, "Times New Roman", serif' };

function Section({ tone, title, children }: { tone: string; title: string; children: React.ReactNode }) {
  return (
    <div className="text-2xl">
      <div className="font-semibold uppercase tracking-wide text-2xl" style={{ color: tone, ...garamond }}>{title}</div>
      <div className="mt-3 space-y-3 text-base leading-relaxed text-white/90" style={garamond}>{children}</div>
    </div>
  );
}

function AboutMyBlessings() {
  return (
    <div style={{ backgroundColor: "#0a1f6b", color: "#ffffff", ...garamond }}>
      <section>
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium" style={garamond}>
            <Heart className="h-3 w-3" fill="currentColor" /> About MyBlessings
          </span>
          <h1 className="mt-6 text-4xl font-semibold md:text-6xl" style={garamond}>
            A world where kindness finds its way to the right person, instantly.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/85" style={garamond}>
            MyBlessings connects people who want to help with people who need support,
            in a way that feels human, simple, and immediate.
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-xl text-white/70" style={garamond}>
            No complexity. No barriers. Just real people helping real people.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-12 space-y-6">
        <Section tone="#86efac" title="What We Do">
          <p className="text-lg">We help kindness travel faster.</p>
          <p className="text-lg">When someone asks for help, and someone else wants to give, we quietly bring them together.</p>
          <p className="text-lg">We look at where people are, what they need, and what support is available. Then we make meaningful connections happen.</p>
        </Section>

        <Section tone="#93c5fd" title="How It Works">
          <ol className="list-decimal space-y-1 pl-5">
            <li className="text-2xl">Someone shares a need</li>
            <li className="text-2xl">Someone else offers support</li>
            <li className="text-2xl">We gently match them</li>
            <li className="text-2xl">Support becomes real impact</li>
          </ol>
          <p className="text-lg">That is it. No noise. No friction. Just connection.</p>
        </Section>

        <Section tone="#c4b5fd" title="Our Belief">
          <ul className="list-disc space-y-1 pl-5">
            <li className="text-lg">Kindness is everywhere</li>
            <li className="text-lg">Most people want to help</li>
            <li className="text-lg">Distance should not block generosity</li>
            <li className="text-lg">Technology should serve humanity, not replace it</li>
          </ul>
        </Section>

        <Section tone="#fdba74" title="Why This Is Different">
          <p className="text-lg">We are not a donation platform. We are not a charity directory.</p>
          <p className="text-lg">We are a connection system for human support, meaning faster help, more personal impact, less waste, more dignity.</p>
        </Section>

        <Section tone="#fca5a5" title="Global Vision">
          <p className="text-lg">MyBlessings is designed to grow into a worldwide network where:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li className="text-lg">Geography becomes irrelevant</li>
            <li className="text-lg">anyone can give support</li>
            <li className="text-lg">geography becomes irrelevant</li>
            <li className="text-lg font-sans">Kindness becomes structured, not random</li>
          </ul>
        </Section>

        <div className="rounded-lg border border-white/15 bg-white/5 p-8 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-yellow-300" />
          <p className="mt-4 text-lg font-medium text-white" style={garamond}>
            If you have ever wanted to help someone but did not know how, you already belong here.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16 text-center">
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="bg-yellow-300 text-[#0a1f6b] hover:bg-yellow-400" style={garamond}>
            <Link to="/give-a-blessing"><HandHeart className="mr-2 h-4 w-4" /> Give a Blessing 🙏</Link>
          </Button>
           <Button asChild size="lg" variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20" style={garamond}>
             <Link to="/request-help"><Compass className="mr-2 h-4 w-4" /> BlessME 🤝</Link>
           </Button>
          <Button asChild size="lg" variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20" style={garamond}>
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