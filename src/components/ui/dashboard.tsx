import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * DashboardCard — unified card surface for all dashboard screens.
 * Token-driven: bg-card, border, shadow-card, rounded-lg.
 */
export const DashboardCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border border-border bg-card text-card-foreground shadow-card p-6",
      className,
    )}
    {...props}
  />
));
DashboardCard.displayName = "DashboardCard";

/**
 * DashboardSection — titled grouping inside a dashboard.
 */
export function DashboardSection({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-4", className)}>
      {(title || actions) && (
        <header className="flex items-end justify-between gap-4">
          <div>
            {title && (
              <h2 className="text-display text-xl font-semibold text-foreground">{title}</h2>
            )}
            {description && (
              <p className="mt-1 text-sm text-muted-foreground text-slate-300">{description}</p>
            )}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  );
}