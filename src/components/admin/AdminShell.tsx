import type { ReactNode } from "react";

interface AdminShellProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

/**
 * Shared dark-glass chrome matching /explore-blessings ("Our Blessings").
 * Wraps admin dashboards so they share the same background, glow accents,
 * and header treatment. Inner content (tables, controls, cards) is
 * untouched — only page chrome.
 */
export function AdminShell({ eyebrow = "Admin", title, description, actions, children }: AdminShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-secondary/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-accent/15 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-6 py-16">
        <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">{eyebrow}</p>
            <h1 className="mt-3 text-display text-4xl font-normal tracking-tight text-foreground md:text-5xl">
              {title}
            </h1>
            {description && (
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>

        <div className="relative text-foreground">{children}</div>
      </div>
    </div>
  );
}
