import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SurfaceLayoutProps {
  children: ReactNode;
  className?: string;
  /**
   * When true, wraps children in a centered max-width container with
   * default page padding. Set to false when the page provides its own
   * outer shell (e.g. AdminShell, hero sections).
   */
  contained?: boolean;
}

/**
 * SurfaceLayout — shared chrome for non-home routes.
 *
 * Enforces the Surface System base: bg-background, text-foreground,
 * min-h-screen. Inner sections / forms / cards opt into the
 * `surface-card` utility for consistent elevation.
 *
 * Do NOT use on the homepage, /explore-blessings, or routes that
 * intentionally render on bg-primary / bg-gradient-hero / AdminShell.
 */
export function SurfaceLayout({ children, className, contained = true }: SurfaceLayoutProps) {
  return (
    <div className={cn("min-h-screen bg-background text-foreground", className)}>
      {contained ? (
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">{children}</div>
      ) : (
        children
      )}
    </div>
  );
}
