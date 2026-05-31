import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Accessibility,
  RadioTower,
  Plane,
  Users,
  ShoppingCart,
  Bike,
  HandHeart,
  Ambulance,
  Home,
  Star,
} from "lucide-react";
type Category = {
  slug: string;
  name: string;
  description: string;
  tags: string[];
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties; strokeWidth?: number }>;
  color: string;
  featured?: boolean;
  wide?: boolean;
};

const CATEGORIES: Category[] = [
  { slug: "accessibility-support", name: "Accessibility Support", description: "Ensure equal access with crutches, transport, and rental equipment.", tags: ["Crutches", "Med-Transport", "Mobility Scooter"], Icon: Accessibility, color: "#22d3ee" },
  { slug: "connectivity-support", name: "Connectivity Support", description: "Ensure digital access with internet vouchers, data bundles, and essential devices.", tags: ["Data Bundles", "eSIMs", "Internet Vouchers"], Icon: RadioTower, color: "#ec4899" },
  { slug: "food-essentials", name: "Food & Essentials Vouchers", description: "Grocery Gift Cards, Meal Vouchers, Pharmacy Vouchers.", tags: ["Grocery Gift Cards", "Meal Vouchers", "Pharmacy"], Icon: ShoppingCart, color: "#facc15" },
  { slug: "non-medical-recovery", name: "Non-Medical Recovery Support", description: "Transition Housing, Meal Support, Non-Emergency Transport.", tags: ["Transition Housing", "Meal Support", "Non-Em"], Icon: HandHeart, color: "#a855f7" },
  { slug: "family-support", name: "Family Support", description: "Baby supplies and Emergency Childcare, School Meal Sponsorship.", tags: ["Baby Supplies", "Emergency Childcare", "School"], Icon: Users, color: "#f43f5e" },
  { slug: "mobility-support", name: "Mobility Support", description: "Ensure digital access, fuel Cards and Mobility Passes.", tags: ["Bicycles", "Fuel Cards", "Mobility Passes"], Icon: Bike, color: "#22c55e" },
  { slug: "emergency-travel", name: "Emergency Travel", description: "Airport Transfers, Plane/Bus Tickets, Family Reunification.", tags: ["Airport Transfers", "Plane/Bus Tickets", "Family"], Icon: Plane, color: "#38bdf8" },
  { slug: "stranded-traveler", name: "Stranded Traveler Assistance", description: "Border Crossing Support, Missed Flight Help, Lost Passport Help.", tags: ["Border Crossing Support", "Missed Flight Help", "Lost Passport"], Icon: Ambulance, color: "#60a5fa" },
  { slug: "temporary-accommodation", name: "Temporary Accommodation", description: "Disaster displacement, Emergency Shelter, Family Relocation.", tags: ["Disaster Displacement", "Emergency Shelter", "Family Reloc"], Icon: Home, color: "#fb923c", wide: true },
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
    Icon: Star,
    color: "#fbbf24",
    featured: true,
    wide: true,
  },
];

const IMPACT_METRICS = [
  { label: "Blessings Delivered", value: "12,847" },
  { label: "Lives Touched", value: "38,200+" },
  { label: "BLESSEE'S REACHED", value: "64" },
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

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 bg-blue-500">
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
  const { Icon, name, description, tags, featured, wide, color } = category;
  const span = wide ? (featured ? "sm:col-span-2 lg:col-span-4" : "sm:col-span-2 lg:col-span-1") : "";

  return (
    <article
      className={`group relative flex flex-col rounded-2xl border bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-6 backdrop-blur-xl transition-all hover:-translate-y-0.5 ${span}`}
      style={{
        borderColor: `${color}55`,
        boxShadow: `0 0 50px -20px ${color}99, inset 0 0 20px -10px ${color}40`,
      }}
    >
      <div className="flex items-start gap-4">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border"
          style={{
            borderColor: `${color}66`,
            backgroundColor: `${color}10`,
            boxShadow: `0 0 24px -6px ${color}80, inset 0 0 16px -8px ${color}80`,
          }}
        >
          <Icon
            className="h-9 w-9"
            style={{ color, filter: `drop-shadow(0 0 8px ${color})`, strokeWidth: 1.5 }}
          />
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
            className="rounded-full border px-2.5 py-0.5 text-xs"
            style={{
              borderColor: `${color}55`,
              backgroundColor: `${color}12`,
              color: `${color}`,
            }}
          >
            {t}
          </span>
        ))}
      </div>

      <div className="mt-auto pt-5">
        <Button
          asChild
          variant="outline"
          className="w-full rounded-xl border-white/20 bg-white/[0.04] text-sm text-white hover:bg-white/[0.1] hover:text-white"
          style={{ borderColor: `${color}40` }}
        >
          <Link to="/give-a-blessing">Explore &amp; Support</Link>
        </Button>
      </div>
    </article>
  );
}