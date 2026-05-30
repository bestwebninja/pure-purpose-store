import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Accessibility,
  Wifi,
  Plane,
  Users,
  ShoppingCart,
  Bike,
  HeartPulse,
  Luggage,
  Home,
  Compass,
} from "lucide-react";
import treeBg from "@/assets/tree-of-life-bg.jpg";

type Category = {
  slug: string;
  name: string;
  description: string;
  tags: string[];
  Icon: React.ComponentType<{ className?: string }>;
  featured?: boolean;
  wide?: boolean;
};

const CATEGORIES: Category[] = [
  { slug: "accessibility-support", name: "Accessibility Support", description: "Ensure equal access with crutches, transport, and rental equipment.", tags: ["Crutches", "Med-Transport", "Mobility Scooter"], Icon: Accessibility },
  { slug: "connectivity-support", name: "Connectivity Support", description: "Ensure digital access with internet vouchers, data bundles, and essential devices.", tags: ["Data Bundles", "eSIMs", "Internet Vouchers"], Icon: Wifi },
  { slug: "emergency-travel", name: "Emergency Travel", description: "Airport Transfers, Plane/Bus Tickets, Family Reunification.", tags: ["Airport Transfers", "Plane/Bus Tickets", "Family"], Icon: Plane },
  { slug: "family-support", name: "Family Support", description: "Baby supplies and Emergency Childcare, School Meal Sponsorship.", tags: ["Baby Supplies", "Emergency Childcare", "School"], Icon: Users },
  { slug: "food-essentials", name: "Food & Essentials Vouchers", description: "Grocery Gift Cards, Meal Vouchers, Pharmacy Vouchers.", tags: ["Grocery Gift Cards", "Meal Vouchers", "Pharmacy"], Icon: ShoppingCart },
  { slug: "mobility-support", name: "Mobility Support", description: "Ensure digital access, fuel Cards and Mobility Passes.", tags: ["Bicycles", "Fuel Cards", "Mobility Passes"], Icon: Bike },
  { slug: "non-medical-recovery", name: "Non-Medical Recovery Support", description: "Transition Housing, Meal Support, Non-Emergency Transport.", tags: ["Transition Housing", "Meal Support", "Non-Em"], Icon: HeartPulse },
  { slug: "stranded-traveler", name: "Stranded Traveler Assistance", description: "Border Crossing Support, Missed Flight Help, Lost Passport Help.", tags: ["Border Crossing Support", "Missed Flight Help", "Lost Passport"], Icon: Luggage },
  { slug: "temporary-accommodation", name: "Temporary Accommodation", description: "Bissister displacement, Emergency Shelter, Family Relocation.", tags: ["Disaster Displacement", "Emergency Shelter", "Family Reloc"], Icon: Home, wide: true },
  {
    slug: "veteran-stabilization",
    name: "Veteran Stabilization",
    description: "Support for veterans facing challenges during and after their transition to civilian life.",
    tags: [
      "transitioning to civilian life",
      "employment and career rebuilding",
      "ptsd and trauma recovery",
      "subbistance abuse and sobriety support",
      "isolation and loss of community",
      "substance abuse and sobriety support",
      "housing instability",
      "financial stress",
      "navigating benefits systems",
    ],
    Icon: Compass,
    featured: true,
    wide: true,
  },
];

const IMPACT_METRICS = [
  { label: "Blessings Delivered", value: "12,847" },
  { label: "Lives Touched", value: "38,200+" },
  { label: "Countries Reached", value: "64" },
];

export const Route = createFileRoute("/explore-blessings")({
  head: () => ({
    meta: [
      { title: "Our Blessings — MyBlessings" },
      { name: "description", content: "Browse blessings available for sponsorship across every assistance category." },
      { property: "og:title", content: "Our Blessings — MyBlessings" },
      { property: "og:description", content: "Browse blessings available for sponsorship across every assistance category." },
      { property: "og:url", content: "https://pure-purpose-store.lovable.app/explore-blessings" },
    ],
    links: [{ rel: "canonical", href: "https://pure-purpose-store.lovable.app/explore-blessings" }],
  }),
  component: ExploreBlessings,
});

function ExploreBlessings() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#06102e]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-center bg-no-repeat opacity-40 mix-blend-screen"
        style={{
          backgroundImage: `url(${treeBg})`,
          backgroundSize: "min(1100px, 90%) auto",
          backgroundPosition: "center 240px",
        }}
      />
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute bottom-0 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-amber-400/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 py-16">
        <header className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300/80">Categories</p>
          <h1 className="mt-3 text-display text-4xl font-normal tracking-tight text-white md:text-5xl">
            Our Blessings
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-white/70">
            Sponsor specific items that meet a real need. Which categories are you passionate about giving a blessing in?
          </p>
        </header>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((cat) => (
            <CategoryCard key={cat.slug} category={cat} />
          ))}
        </div>

        <section className="mt-16">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300/80">Recent Global Impact</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {IMPACT_METRICS.map((m) => (
              <div
                key={m.label}
                className="rounded-2xl border border-cyan-300/20 bg-white/[0.04] p-6 text-center shadow-[0_0_40px_-15px_rgba(56,189,248,0.4)] backdrop-blur-xl"
              >
                <div className="text-display text-3xl text-white md:text-4xl">{m.value}</div>
                <div className="mt-2 text-xs uppercase tracking-[0.2em] text-cyan-200/70">{m.label}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function CategoryCard({ category }: { category: Category }) {
  const { Icon, name, description, tags, featured, wide } = category;
  const span = wide ? (featured ? "sm:col-span-2 lg:col-span-3" : "sm:col-span-2 lg:col-span-1") : "";
  const iconColor = featured ? "text-amber-300" : "text-cyan-300";
  const ring = featured
    ? "border-amber-300/40 shadow-[0_0_60px_-20px_rgba(251,191,36,0.6)]"
    : "border-cyan-300/20 shadow-[0_0_50px_-20px_rgba(56,189,248,0.5)]";

  return (
    <article
      className={`group relative flex flex-col rounded-2xl border ${ring} bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-6 backdrop-blur-xl transition-all hover:border-cyan-200/50 hover:shadow-[0_0_70px_-15px_rgba(56,189,248,0.7)] ${span}`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border ${
            featured ? "border-amber-300/40 bg-amber-300/5" : "border-cyan-300/30 bg-cyan-400/5"
          }`}
        >
          <Icon className={`h-9 w-9 ${iconColor} drop-shadow-[0_0_8px_currentColor]`} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-display text-xl leading-tight text-white">{name}</h2>
          <p className="mt-1.5 text-sm leading-snug text-white/65">{description}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-white/50">{featured ? "New:" : "Preview:"}</span>
        {tags.map((t) => (
          <span
            key={t}
            className={`rounded-full border px-2.5 py-0.5 text-xs ${
              featured
                ? "border-amber-200/40 bg-amber-300/5 text-amber-100/90"
                : "border-cyan-200/30 bg-cyan-300/5 text-cyan-100/90"
            }`}
          >
            {t}
          </span>
        ))}
      </div>

      <div className="mt-auto pt-5">
        <Button
          asChild
          variant="outline"
          className="w-full rounded-xl border-cyan-200/30 bg-white/[0.04] text-sm text-white hover:border-cyan-200/60 hover:bg-white/[0.08] hover:text-white"
        >
          <Link to="/give-a-blessing">Explore &amp; Support</Link>
        </Button>
      </div>
    </article>
  );
}