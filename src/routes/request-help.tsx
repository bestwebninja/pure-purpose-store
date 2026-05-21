import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/request-help")({
  head: () => ({
    meta: [
      { title: "BlessME — Request a Blessing" },
      { name: "description", content: "Sign up as a recipient and tell us what you need. Kind sponsors will be matched to your request." },
    ],
  }),
  component: RequestHelpPage,
});

function RequestHelpPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12 text-white">
      <header className="space-y-3 text-center sm:text-left">
        {/* FIXED: Explicit unicode literal injection prevents character corruption in the header view */}
        <h1 className="text-display text-3xl font-semibold md:text-4xl">
          BlessME {"\u{1F64F}"}
        </h1>
        <p className="text-base text-muted-foreground">
          Sign up as a recipient and tell us what you need. Sponsors will be matched to your request.
        </p>
      </header>

      <form className="mt-10 space-y-6 rounded-2xl border border-border/60 bg-card p-6 shadow-xl" onSubmit={(e) => e.preventDefault()}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">First name *</label>
            <Input type="text" placeholder="John" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Surname *</label>
            <Input type="text" placeholder="Doe" required />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Email *</label>
          <Input type="email" placeholder="john.doe@example.com" required />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Cell phone (optional)</label>
          <Input type="tel" placeholder="+1 (555) 000-0000" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Create a password *</label>
          <Input type="password" placeholder="••••••••" required />
          <p className="text-xs text-muted-foreground">We'll create a recipient account so you can track your blessing.</p>
        </div>

        <hr className="border-border/60" />

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Title of your request *</label>
          <Input type="text" placeholder="e.g., Medical Bills Support or Winter Groceries" required />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Describe your situation *</label>
          <textarea 
            className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Please tell us about your situation briefly and truthfully..."
            required
          />
        </div>

        <div className="rounded-xl bg-secondary/40 p-4 border border-border/40">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong>Note on Food Needs:</strong> Food requests must be vegan, pure-veg, raw-organic, or a fresh fruit & veg basket.
          </p>
        </div>

        <Button type="submit" className="w-full h-11 bg-accent text-primary font-semibold hover:bg-accent/90">
          Submit Blessing Request
        </Button>
      </form>
    </div>
  );
}