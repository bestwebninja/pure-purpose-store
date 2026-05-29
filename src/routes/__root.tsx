import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground text-white">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "MyBlessings — Give With Purpose" },
      { name: "description", content: "MyBlessings is a giving platform where every donation becomes a blessing for someone in need. Start a campaign or support a cause today." },
      { name: "author", content: "MyBlessings" },
      { property: "og:title", content: "MyBlessings — Give With Purpose" },
      { property: "og:description", content: "MyBlessings is a giving platform where every donation becomes a blessing for someone in need. Start a campaign or support a cause today." },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "MyBlessings" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "MyBlessings — Give With Purpose" },
      { name: "twitter:description", content: "MyBlessings is a giving platform where every donation becomes a blessing for someone in need. Start a campaign or support a cause today." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/2fe7578f-77b2-404e-a914-f1dca43a1197/id-preview-7ee31c5f--737fd275-ad78-47b5-b4fa-52015a1c3375.lovable.app-1777994720837.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/2fe7578f-77b2-404e-a914-f1dca43a1197/id-preview-7ee31c5f--737fd275-ad78-47b5-b4fa-52015a1c3375.lovable.app-1777994720837.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=Great+Vibes&display=swap" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "MyBlessings",
          url: "https://pure-purpose-store.lovable.app",
          description: "A giving platform where every donation becomes a blessing for someone in need.",
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <div className="flex min-h-screen flex-col bg-yellow-600">
      <SiteHeader />
      <main className="flex-1 bg-blue-800">
        <Outlet />
      </main>
      <SiteFooter />
      <Toaster position="top-center" richColors />
    </div>
  );
}

