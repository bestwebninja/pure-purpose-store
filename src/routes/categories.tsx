import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "../components/ui/card";
import { listCategories } from "@/server/ngo.functions";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "Browse Categories — MyBlessings" },
      { name: "description", content: "Discover causes by category — children, education, healthcare, disaster relief, food, and elder care." },
      { property: "og:title", content: "Browse Categories — MyBlessings" },
      { property: "og:description", content: "Discover causes by category." },
      { property: "og:url", content: "https://pure-purpose-store.lovable.app/categories" },
    ],
    links: [{ rel: "canonical", href: "https://pure-purpose-store.lovable.app/categories" }],
  }),
  loader: async () => await listCategories(),
  component: CategoriesPage,
});

function CategoriesPage() {
  const data = Route.useLoaderData();
  
  // Safely grab the categories list whether it's wrapped in an object or returned as a raw array
  const categoriesList = Array.isArray(data) 
    ? data 
    : (data as any)?.categories ?? [];

  return (
    <div className="mx-auto max-w-6xl px-6 py-16 text-white">
      <h1 className="text-display text-4xl font-semibold">Browse by category</h1>
      <p className="mt-2 text-muted-foreground">Find a cause that resonates with you.</p>
      
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categoriesList.map((c: { id: string; slug: string; name: string; description: string | null }) => (
          <Link key={c.id} to="/categories/$slug" params={{ slug: c.slug }} className="group">
            <Card className="p-6 transition hover:shadow-card bg-card border-border/60 group-hover:border-primary/50 text-white">
              <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">{c.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

