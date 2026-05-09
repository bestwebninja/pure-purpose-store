import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Sparkles, Users, ShieldCheck, BrainCircuit, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InspirationQuote } from "@/components/site/InspirationQuote";

export const Route = createFileRoute("/about-myblessings")({
  head: () => ({
    meta: [
      { title: "About MyBlessings" },
      { name: "description", content: "Building a world where kindness becomes infrastructure." },
      { property: "og:title", content: "About MyBlessings" },
      { property: "og:description", content: "A compassion economy connecting sponsors, providers, and people in need." },
    ],
  }),
  component: AboutMyBlessings,
});

function Block({ icon: Icon, title, body }: { icon: React.ElementType; title: string; body: string }) {
  return (
    <Card className="p-6">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-display text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
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
            Building a World Where Kindness Becomes Infrastructure
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
            MyBlessings is a compassion economy — a transparent marketplace where sponsors,
            providers and people in need meet, supported by AI-powered matching.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-yellow-300 text-[#0a1f6b] hover:bg-yellow-400">
              <Link to="/give-a-blessing">Give a Blessing 🙏</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20">
              <Link to="/ngo">Become a Partner</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Block icon={Sparkles} title="Compassion Economy"
            body="Every blessing is a real transaction with a real outcome — kindness with proof of impact." />
          <Block icon={Users} title="Sponsorship Network"
            body="Discover blessings across every assistance category and sponsor specific items that meet a real need." />
          <Block icon={ShieldCheck} title="NGO System"
            body="Vetted partners and providers fulfill blessings on the ground, with full audit trails." />
          <Block icon={BrainCircuit} title="AI Matching"
            body="Smart matching connects sponsors to nearby recipients and providers based on category, location and urgency." />
        </div>
      </section>

      <section className="bg-secondary/40">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center">
          <h2 className="text-display text-3xl font-semibold">Many Faiths. One Kindness.</h2>
          <p className="mt-4 text-muted-foreground">
            MyBlessings is a home for everyone who believes in showing up for each other —
            whatever your tradition or path.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            {["Christian", "Jewish", "Spiritual", "Open Hearted"].map((f) => (
              <Card key={f} className="p-5 text-center">
                <ShieldCheck className="mx-auto h-6 w-6 text-primary" />
                <p className="mt-3 font-semibold">{f}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 text-center">
        <h2 className="text-display text-3xl font-semibold">Join the movement</h2>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="bg-yellow-300 text-[#0a1f6b] hover:bg-yellow-400">
            <Link to="/give-a-blessing">Give a Blessing 🙏</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/ngo">Become a Partner</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-16">
        <InspirationQuote variant="banner" />
      </section>
    </div>
  );
}