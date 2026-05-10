import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type CategoryNode = {
  id: string;
  parent_id: string | null;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  children: CategoryNode[];
};

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

export const Route = createFileRoute("/explore-blessings")({
  head: () => ({
    meta: [
      { title: "Explore Blessings — MyBlessings" },
      { name: "description", content: "Browse blessings available for sponsorship across every assistance category." },
    ],
  }),
  component: ExploreBlessings,
});

function ExploreBlessings() {
  const [tree, setTree] = useState<CategoryNode[]>([]);
  const [blessings, setBlessings] = useState<Blessing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [treeRes, blessingsRes] = await Promise.all([
          fetch("/api/categories/tree", { credentials: "include" }).then((r) => r.json()),
          supabase
            .from("blessings")
            .select("id,title,slug,description,price,currency,image_url,category_id,provider_id")
            .eq("status", "ACTIVE")
            .order("created_at", { ascending: false })
            .limit(60),
        ]);
        if (cancelled) return;
        setTree(treeRes?.tree ?? []);
        if (blessingsRes.error) throw blessingsRes.error;
        setBlessings((blessingsRes.data ?? []) as Blessing[]);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = activeCategory
    ? blessings.filter((b) => b.category_id === activeCategory)
    : blessings;

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <header className="mb-8">
        <h1 className="text-display text-4xl font-semibold">Explore Blessings</h1>
        <p className="mt-2 text-muted-foreground">Sponsor specific items that meet a real need.</p>
      </header>

      {error && (
        <Card className="mb-6 border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">{error}</Card>
      )}

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Categories</h2>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={activeCategory === null ? "default" : "outline"}
            onClick={() => setActiveCategory(null)}
          >
            All
          </Button>
          {tree.map((root) => (
            <Button
              key={root.id}
              size="sm"
              variant={activeCategory === root.id ? "default" : "outline"}
              onClick={() => setActiveCategory(root.id)}
            >
              {root.name}
              {root.children.length > 0 && (
                <span className="ml-1 text-xs opacity-60">({root.children.length})</span>
              )}
            </Button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Blessings ({loading ? "…" : filtered.length})
        </h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : filtered.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No blessings available yet in this category.</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Providers can add blessings from their dashboard once approved.
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
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{b.description}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">
                      {b.currency} {Number(b.price).toFixed(0)}
                    </Badge>
                    <Button asChild size="sm">
                      <Link to="/">Sponsor</Link>
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