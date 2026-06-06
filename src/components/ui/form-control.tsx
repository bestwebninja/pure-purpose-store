import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

/**
 * Shared FormControl primitives. Works on both light and dark surfaces.
 * Use `surface="dark"` inside dark/navy panels (sponsor onboarding, request-help,
 * give-a-blessing, corporate signup). Default surface = light card / muted bg.
 *
 * All primitives are full-width, mobile-first (min 44px hit-area on iOS),
 * and use semantic tokens — no hardcoded palette classes.
 */

type Surface = "light" | "dark";

const surfaceInput: Record<Surface, string> = {
  light:
    "border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring",
  dark:
    "border-white/25 bg-white/10 text-primary-foreground placeholder:text-white/60 focus-visible:border-accent focus-visible:ring-accent",
};

const baseField =
  "flex min-h-11 w-full rounded-md border px-3 py-2 text-base sm:text-sm focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-60";

export function FormField({
  label,
  htmlFor,
  hint,
  error,
  surface = "light",
  children,
  className,
}: {
  label?: React.ReactNode;
  htmlFor?: string;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  surface?: Surface;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0 space-y-1.5", className)}>
      {label && (
        <Label
          htmlFor={htmlFor}
          className={cn("text-sm", surface === "dark" ? "text-white/85" : "text-foreground")}
        >
          {label}
        </Label>
      )}
      {children}
      {hint && (
        <p className={cn("text-xs", surface === "dark" ? "text-white/60" : "text-muted-foreground")}>
          {hint}
        </p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export const FormInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { surface?: Surface }
>(({ className, surface = "light", ...props }, ref) => (
  <input ref={ref} className={cn(baseField, surfaceInput[surface], className)} {...props} />
));
FormInput.displayName = "FormInput";

export const FormTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { surface?: Surface }
>(({ className, surface = "light", rows = 3, ...props }, ref) => (
  <textarea
    ref={ref}
    rows={rows}
    className={cn(baseField, "min-h-[6rem] leading-6", surfaceInput[surface], className)}
    {...props}
  />
));
FormTextarea.displayName = "FormTextarea";

/**
 * Native <select> styled to match. Native dropdowns are the most reliable
 * mobile pattern for long lists (NTEE categories, food kinds, etc.).
 * Use the shadcn <Select> only when you need rich content or async loads.
 */
export const FormSelect = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { surface?: Surface }
>(({ className, surface = "light", children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(baseField, "pr-9", surfaceInput[surface], className)}
    {...props}
  >
    {children}
  </select>
));
FormSelect.displayName = "FormSelect";

/**
 * FormGrid — mobile-first responsive grid for paired fields.
 * Defaults to single column under sm, two columns from sm and up.
 */
export function FormGrid({
  columns = 2,
  className,
  children,
}: {
  columns?: 2 | 3;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4",
        columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 md:grid-cols-3",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * FormPanel — a titled section inside a long form. Stacks naturally on mobile.
 */
export function FormPanel({
  title,
  description,
  surface = "light",
  children,
  className,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  surface?: Surface;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "space-y-4 rounded-lg border p-4 sm:p-6",
        surface === "dark"
          ? "border-white/15 bg-white/5 text-primary-foreground"
          : "border-border bg-card text-card-foreground shadow-card",
        className,
      )}
    >
      {(title || description) && (
        <header className="space-y-1">
          {title && (
            <h2
              className={cn(
                "text-display text-base font-semibold sm:text-lg",
                surface === "dark" ? "text-primary-foreground" : "text-foreground",
              )}
            >
              {title}
            </h2>
          )}
          {description && (
            <p className={cn("text-xs sm:text-sm", surface === "dark" ? "text-white/70" : "text-muted-foreground")}>
              {description}
            </p>
          )}
        </header>
      )}
      <div className="space-y-4">{children}</div>
    </section>
  );
}