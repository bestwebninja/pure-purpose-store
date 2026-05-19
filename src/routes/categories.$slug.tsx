import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { listCampaignsByCategory } from "@/server/campaigns.functions";
import { CampaignCard } from "../components/blessing/CampaignCard";
import { useCampaignsRealtime } from "../hooks/useCampaignRealtime";

export const Route = createFileRoute("/categories/$slug")({
  loader: async ({ params }) => {
    const res = await listCampaignsByCategory({ data: params.slug });
    if (!res.category) throw notFound();
    return res;
  },
  head: ({ loaderData }) => ({
    meta: loaderData?.category
      ? [
          { title: `${loaderData.category.name} Blessings â€” MyBlessings` },
          { name: "description", content: loaderData.category.description ?? `Support ${loaderData.category.name} causes.` },
          { property: "og:title", content: `${loaderData.category.name} Blessings â€” MyBlessings` },
          { property: "og:description", content: loaderData.category.description ?? `Support ${loaderData.category.name} causes.` },
          { property: "og:url", content: `https://pure-purpose-store.lovable.app/categories/${loaderData.category.slug}` },
        ]
      : [{ title: "Category â€” MyBlessings" }],
    links: loaderData?.category
      ? [{ rel: "canonical", href: `https://pure-purpose-store.lovable.app/categories/${loaderData.category.slug}` }]
      : [],
  }),
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-6 py-24 text-center">
      <h1 className="text-display text-3xl font-semibold text-white">Category not found</h1>
      <Link to="/categories" className="mt-4 inline-block text-primary hover:underline">â† All categories</Link>
    </div>
  ),
  component: CategoryPage,
});

function CategoryPage() {
  const { category, campaigns } = Route.useLoaderData();
  const live = useCampaignsRealtime<Campaign>(campaigns as Campaign[]);
  return (
    <div className="mx-auto max-w-7xl px-6 py-12 text-white">
      <Link to="/categories" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" /> All categories
      </Link>
      <h1 className="text-display mt-4 text-4xl font-semibold">{category!.name}</h1>
      {category!.description && <p className="mt-2 text-muted-foreground">{category!.description}</p>}
      <div className="mt-10">
        {live.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border/80 bg-secondary/30 p-12 text-center">
            <p className="text-sm text-muted-foreground">No active blessings in this category yet.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {live.map((c) => <CampaignCard key={c.id} campaign={c} />)}
          </div>
        )}
      </div>
    </div>
  );
}

