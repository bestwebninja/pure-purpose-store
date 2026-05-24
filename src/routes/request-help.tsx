import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/request-help")({
  head: () => ({
    meta: [
      { title: "BlessME — Request a Blessing" },
      { name: "description", content: "Sign up as a recipient and tell us what you need. Sponsors will be matched to your request." },
    ],
  }),
  component: RequestHelpPage,
});

const TITLES = ["Mr", "Mrs", "Ms", "Miss", "Mx", "Dr", "Other"];
const CATEGORIES = [
  "Medical",
  "Education",
  "Food & Groceries",
  "Housing & Shelter",
  "Employment",
  "Family & Childcare",
  "Utilities",
  "Emergency",
  "Other",
];
const NEED_TYPES = [
  "accommodation",
  "travel",
  "food",
  "medical",
  "clothing",
  "education",
  "childcare",
  "employment",
  "utilities",
  "other",
];

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-sm font-medium text-muted-foreground">{children}</label>;
}

function SelectBase(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    />
  );
}

function NeedRow({ i }: { i: number }) {
  return (
    <div className="grid gap-2 sm:grid-cols-[180px_1fr]">
      <SelectBase name={`need_type_${i}`} defaultValue="">
        <option value="" disabled>Type…</option>
        {NEED_TYPES.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </SelectBase>
      <Input name={`need_desc_${i}`} type="text" placeholder="Briefly describe this need" />
    </div>
  );
}

function RequestHelpPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12 text-white">
      <header className="space-y-3 text-center sm:text-left">
        <h1 className="text-display text-3xl font-semibold md:text-4xl">
          BlessME {"\u{1F64F}"}
        </h1>
        <p className="text-base text-muted-foreground">
          Sign up as a recipient and tell us what you need. Sponsors will be matched to your request.
        </p>
      </header>

      <form
        className="mt-10 space-y-6 rounded-2xl border border-border/60 bg-card p-6 shadow-xl"
        onSubmit={(e) => e.preventDefault()}
      >
        {/* Identity */}
        <div className="grid gap-4 sm:grid-cols-[120px_1fr_1fr]">
          <div className="space-y-2">
            <Label>Title</Label>
            <SelectBase name="title" defaultValue="">
              <option value="" disabled>—</option>
              {TITLES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </SelectBase>
          </div>
          <div className="space-y-2">
            <Label>First name *</Label>
            <Input name="first_name" type="text" required />
          </div>
          <div className="space-y-2">
            <Label>Surname *</Label>
            <Input name="last_name" type="text" required />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Email *</Label>
            <Input name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label>Cell phone (optional)</Label>
            <Input name="phone" type="tel" placeholder="+1 555-555-0127" />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Create a password *</Label>
          <Input name="password" type="password" placeholder="At least 8 characters" required />
          <p className="text-xs text-muted-foreground">
            We'll create a recipient account so you can track your blessing.
          </p>
        </div>

        <hr className="border-border/60" />

        {/* Request meta */}
        <div className="space-y-2">
          <Label>Title *</Label>
          <Input name="request_title" type="text" placeholder="Short summary of what you need" required />
        </div>

        <div className="space-y-2">
          <Label>Category *</Label>
          <SelectBase name="category" defaultValue="" required>
            <option value="" disabled>Select a category</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </SelectBase>
        </div>

        <div className="space-y-2">
          <Label>Describe your situation</Label>
          <textarea
            name="description"
            rows={5}
            className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        {/* Needs */}
        <div className="space-y-3">
          <div>
            <Label>What kind of help do you need?</Label>
            <p className="text-xs text-muted-foreground mt-1">
              Add up to 5 specific needs. Pick a type and briefly describe it. Food must be vegan, pure-veg, raw-organic, or a fruit &amp; veg basket.
            </p>
          </div>
          {[0, 1, 2, 3, 4].map((i) => (
            <NeedRow key={i} i={i} />
          ))}
        </div>

        {/* Address */}
        <div className="space-y-2">
          <Label>Street address</Label>
          <Input name="street" type="text" placeholder="e.g. 123 Main St, Apt 4B" />
        </div>

        <div className="space-y-2">
          <Label>Country</Label>
          <Input name="country" type="text" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>City</Label>
            <Input name="city" type="text" />
          </div>
          <div className="space-y-2">
            <Label>State</Label>
            <Input name="state" type="text" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Zip</Label>
            <Input name="zip" type="text" placeholder="e.g. 90210" />
          </div>
          <div className="space-y-2">
            <Label>Postal code</Label>
            <Input name="postal_code" type="text" placeholder="e.g. SW1A 1AA" />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-11 bg-accent text-primary font-semibold hover:bg-accent/90"
        >
          Submit Application
        </Button>
      </form>
    </div>
  );
}
