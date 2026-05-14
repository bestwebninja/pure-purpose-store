import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const BASE_URL = "https://pure-purpose-store.lovable.app";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const STATIC_ENTRIES: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/about-myblessings", changefreq: "monthly", priority: "0.8" },
  { path: "/how-it-works", changefreq: "monthly", priority: "0.8" },
  { path: "/give", changefreq: "weekly", priority: "0.9" },
  { path: "/give-a-blessing", changefreq: "weekly", priority: "0.8" },
  { path: "/request-help", changefreq: "weekly", priority: "0.8" },
  { path: "/explore-blessings", changefreq: "weekly", priority: "0.7" },
  { path: "/marketplace", changefreq: "daily", priority: "0.8" },
  { path: "/impact-map", changefreq: "weekly", priority: "0.6" },
  { path: "/categories", changefreq: "monthly", priority: "0.7" },
  { path: "/transparency", changefreq: "monthly", priority: "0.7" },
  { path: "/ngo", changefreq: "monthly", priority: "0.6" },
  { path: "/become-blessing-sponsor", changefreq: "monthly", priority: "0.6" },
  { path: "/login", changefreq: "yearly", priority: "0.3" },
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [...STATIC_ENTRIES];

        try {
          const [{ data: campaigns }, { data: categories }] = await Promise.all([
            supabaseAdmin.from("campaigns").select("handle, updated_at").eq("status", "active"),
            supabaseAdmin.from("categories").select("slug"),
          ]);
          for (const c of campaigns ?? []) {
            if (!c?.handle) continue;
            entries.push({
              path: `/campaign/${c.handle}`,
              lastmod: c.updated_at ? new Date(c.updated_at).toISOString() : undefined,
              changefreq: "daily",
              priority: "0.8",
            });
          }
          for (const cat of categories ?? []) {
            if (!cat?.slug) continue;
            entries.push({
              path: `/categories/${cat.slug}`,
              changefreq: "weekly",
              priority: "0.6",
            });
          }
        } catch {
          // sitemap still works with static entries if DB is unreachable
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});