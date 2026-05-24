import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";

type Blessing = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  currency: string;
  image_url: string | null;
  category_id: string | null;
  provider_id: string | null;
};

const CATEGORY_TAXONOMY: { slug: string; icon: string; name: string; subs: string[] }[] = [
  {
    slug: "temporary-accommodation",
    icon: "🏨",
    name: "Temporary Accommodation",
    subs: [
      "Emergency shelter",
      "Family relocation",
      "Stranded traveler",
      "Domestic violence relocation",
      "Disaster displacement",
      "Hospital nearby stays",
      "Military & Veterans Housing",
    ],
  },
  {
    slug: "emergency-travel",
    icon: "✈️",
    name: "Emergency Travel",
    subs: [
      "Bus / Train / Airline tickets",
      "Rideshare credits",
      "Airport transfers",
      "Military & Veterans Travel",
    ],
  },
  {
    slug: "mobility-support",
    icon: "🚗",
    name: "Mobility Support",
    subs: [
      "Uber rides",
      "Taxi vouchers",
      "Scooters",
      "Bicycles",
      "Fuel cards",
      "Mobility passes",
      "Military & Veterans Mobility",
    ],
  },
  {
    slug: "accessibility-support",
    icon: "♿",
    name: "Accessibility Support",
    subs: [
      "Wheelchair hire",
      "Crutches",
      "Walkers",
      "Medical transport coordination",
      "Mobility scooter rental",
      "Military & Veterans Accessibility Support",
    ],
  },
  {
    slug: "food-essentials",
    icon: "🍴",
    name: "Food & Essentials Vouchers",
    subs: [
      "Grocery gift cards",
      "Meal vouchers",
      "Pharmacy gift cards",
      "Prepaid essentials",
      "Military & Veterans Rations / Essentials",
    ],
  },
  {
    slug: "connectivity-support",
    icon: "📱",
    name: "Connectivity Support",
    subs: [
      "Mobile airtime",
      "eSIMs",
      "Data bundles",
      "Internet vouchers",
      "Prepaid phones",
      "Military & Veterans Connectivity",
    ],
  },
  {
    slug: "family-support",
    icon: "👶",
    name: "Family Support",
    subs: [
      "Diapers",
      "Baby supplies",
      "School transport",
      "Emergency childcare rides",
      "School meal sponsorship",
      "Military & Veterans Families Support",
    ],
  },
  {
    slug: "stranded-traveler",
    icon: "🧳",
    name: "Stranded Traveler Assistance",
    subs: [
      "Missed flights",
      "Emergency overnight stays",
      "Passport-loss assistance",
      "Border / airport transport",
      "Military & Veterans Stranded Assistance",
    ],
  },
  {
    slug: "non-medical-recovery",
    icon: "🏥",
    name: "Non-Medical Recovery Support",
    subs: [
      "Accommodation near hospitals",
      "Transport to treatment",
      "Meal support during recovery",
      "Military & Veterans Recovery Logistics",
    ],
  },
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
  const [blessings, setBlessings] = useState<Blessing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSub, setActiveSub] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await supabase
          .from("blessings")
          .select("id,title,slug,description,price,currency,image_url,category_id,provider_id")
          .eq("status", "ACTIVE")
          .order("created_at", { ascending: false })
          .limit(60);
        if (cancelled) return;
        if (res.error) setError(res.error.message);
        else setBlessings((res.data ?? []) as Blessing[]);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load blessings");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Sub-category filtering is taxonomy-driven; until DB blessings carry the
  // new category mapping, a sub-category selection narrows to an empty state.
  const filtered = activeSub ? [] : blessings;

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <header className="mb-8">
        <h1 className="text-display text-5xl font-normal tracking-tight text-foreground md:text-6xl text-yellow-100">
          Our Blessings
        </h1>
        <p className="mt-2 text-muted-foreground text-slate-50">Sponsor specific items that meet a real need.</p>
      </header>

      {error && (
        <Card className="mb-6 border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">{error}</Card>
      )}

      <section className="mb-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Categories
          </h2>
          {activeSub && (
            <Button size="sm" variant="ghost" onClick={() => setActiveSub(null)} className="text-white">
              Clear filter
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_TAXONOMY.map((cat) => {
            const isActiveCat = activeSub?.startsWith(`${cat.slug}::`);
            return (
              <DropdownMenu key={cat.slug}>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant={isActiveCat ? "default" : "secondary"}
                    className="rounded-full bg-blue-700 text-white"
                  >
                    <span className="mr-1.5" aria-hidden>{cat.icon}</span>
                    {cat.name}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  <DropdownMenuLabel>{cat.name}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {cat.subs.map((sub) => {
                    const key = `${cat.slug}::${sub}`;
                    return (
                      <DropdownMenuItem
                        key={key}
                        onSelect={() => setActiveSub(activeSub === key ? null : key)}
                      >
                        {sub}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {activeSub
            ? activeSub.split("::")[1]
            : `Blessings${loading ? "" : ` (${filtered.length})`}`}
        </h2>
        {loading ? (
          <p className="text-sm text-muted-foreground text-white">Loading…</p>
        ) : filtered.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              No active blessings currently available in this category.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((b) => (
              <Card key={b.id} className="overflow-hidden p-0">
                {b.image_url && (
                  <img src={b.image_url} alt={b.title} className="h-40 w-full object-cover" />
                )}
                <div className="space-y-3 p-4">
                  <div>
                    <h3 className="font-semibold">{b.title}</h3>
                    {b.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground text-white">{b.description}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">
                      {b.currency} {Number(b.price).toFixed(0)}
                    </Badge>
                    <Button asChild size="sm">
                      <Link to="/give">Sponsor</Link>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

