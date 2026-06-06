import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { InspirationQuote } from "@/components/site/InspirationQuote";

type CategoryNode = {
  id: string;
  slug: string;
  name: string;
  children: CategoryNode[];
};

export const Route = createFileRoute("/request-help")({
  head: () => ({
    meta: [
       { title: "BlessME — MyBlessings" },
      { name: "description", content: "Tell us what you need. We'll connect you with sponsors and providers." },
      { property: "og:title", content: "BlessME — Request a Blessing" },
      { property: "og:description", content: "Share your story and connect with sponsors who want to help." },
      { property: "og:url", content: "https://pure-purpose-store.lovable.app/request-help" },
    ],
    links: [{ rel: "canonical", href: "https://pure-purpose-store.lovable.app/request-help" }],
  }),
  component: RequestHelp,
});

const inputCls =
  "border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/60 focus-visible:border-accent focus-visible:ring-accent";

const HELP_TYPES: { value: string; label: string }[] = [
  { value: "accommodation", label: "Accommodation" },
  { value: "travel",        label: "Travel" },
  { value: "food",          label: "Food" },
  { value: "medical",       label: "Medical" },
  { value: "clothing",      label: "Clothing" },
  { value: "education",     label: "Education" },
  { value: "childcare",     label: "Childcare" },
  { value: "employment",    label: "Employment" },
  { value: "utilities",     label: "Utilities" },
  { value: "other",         label: "Other" },
];

const FOOD_KINDS: { value: string; label: string }[] = [
  { value: "vegan",                  label: "Vegan" },
  { value: "pure-veg",               label: "Pure-veg" },
  { value: "raw-organic",            label: "Raw organic" },
  { value: "fruit-and-veg-basket",   label: "Fruit & veg basket" },
];

const SALUTATIONS = ["Mr", "Mrs", "Ms", "Mx", "Dr", "Other"];

type HelpNeed = { type: string; details: string; food_kind?: string };

function RequestHelp() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [tree, setTree] = useState<CategoryNode[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    salutation: "",
    firstName: "",
    surname: "",
    email: "",
    phone: "",
    password: "",
    title: "",
    description: "",
    category_id: "",
    country: "",
    address_line1: "",
    city: "",
    state: "",
    zip: "",
    postal_code: "",
  });
  const [needs, setNeeds] = useState<HelpNeed[]>([
    { type: "", details: "" },
    { type: "", details: "" },
    { type: "", details: "" },
    { type: "", details: "" },
    { type: "", details: "" },
  ]);

  const updateNeed = (i: number, patch: Partial<HelpNeed>) =>
    setNeeds((prev) => prev.map((n, idx) => (idx === i ? { ...n, ...patch } : n)));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;
      if (data.user) {
        setUserId(data.user.id);
        if (data.user.email) {
          setForm((f) => (f.email ? f : { ...f, email: data.user!.email! }));
        }
      }
      try {
        const res = await fetch("/api/categories/tree", { credentials: "include" });
        const json = await res.json();
        if (!cancelled) setTree(json?.tree ?? []);
      } catch {
        // non-fatal
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const flatCategories = tree.flatMap((root) => [
    { id: root.id, label: root.name },
    ...root.children.map((c) => ({ id: c.id, label: `${root.name} › ${c.name}` })),
  ]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.surname.trim() || !form.email.trim()) {
      toast.error("Please provide your first name, surname and email.");
      return;
    }
    if (!form.title.trim() || !form.category_id) {
      toast.error("Please fill in a title and select a category.");
      return;
    }
    if (!userId && form.password.length < 6) {
      toast.error("Please choose a password (at least 6 characters) to create your account.");
      return;
    }
    setSubmitting(true);
    let recipientId = userId;
    if (!recipientId) {
      const redirectTo = `${window.location.origin}/my-blessings`;
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            display_name: `${form.firstName.trim()} ${form.surname.trim()}`.trim(),
          },
        },
      });
      if (signUpError) {
        setSubmitting(false);
        toast.error(signUpError.message);
        return;
      }
      recipientId = signUpData.user?.id ?? null;
      if (!recipientId) {
        setSubmitting(false);
        toast.success("Check your email to confirm your account, then submit your request.");
        return;
      }
    }
    const filledNeeds = needs.filter((n) => n.type.trim() || n.details.trim());
    // Build allocation_needs payload that matches the DB validation trigger.
    const allocationNeeds = filledNeeds
      .filter((n) => n.type)
      .map((n) => {
        const base: Record<string, string> = { type: n.type };
        if (n.details.trim()) base.details = n.details.trim();
        if (n.type === "food" && n.food_kind) base.food_kind = n.food_kind;
        return base;
      });
    // Block submit if a food row is missing its food_kind (trigger would reject).
    const foodMissingKind = filledNeeds.some(
      (n) => n.type === "food" && !n.food_kind,
    );
    if (foodMissingKind) {
      setSubmitting(false);
      toast.error("For food needs, please pick vegan, pure-veg, raw-organic, or fruit & veg basket.");
      return;
    }
    const { error } = await supabase.from("cases").insert({
      recipient_user_id: recipientId,
      title: form.title.trim(),
      description: form.description.trim() || null,
      category_id: form.category_id,
      target_amount: 0,
      country: form.country.trim() || null,
      region: form.state.trim() || null, // back-compat
      salutation: form.salutation || null,
      address_line1: form.address_line1.trim() || null,
      city: form.city.trim() || null,
      state: form.state.trim() || null,
      postal_code: (form.postal_code.trim() || form.zip.trim()) || null,
      allocation_needs: allocationNeeds,
      status: "PENDING",
    } as never);
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    // Non-blocking Petri Bloom signal.
    try {
      void fetch("/api/public/petri-bloom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_type: "request",
          location: {
            city: form.city,
            state: form.state,
            country: form.country,
            zip: form.zip,
            postal_code: form.postal_code,
          },
          category_ids: form.category_id ? [form.category_id] : [],
          help_needs: allocationNeeds,
        }),
      }).catch(() => {});
    } catch { /* noop */ }
    toast.success("Application submitted.");
    navigate({ to: "/my-blessings" });
  };

  return (
    <div className="min-h-screen bg-primary text-primary-foreground">
      <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-16">
         <h1 className="text-display text-3xl font-semibold">BlessME 🙏</h1>
        <p className="mt-2 text-primary-foreground/80">
          Sign up as a recipient or tell us about someone you think needs to be Blessed. Sponsors funds will be automatically matched to your request and once accepted the process of buying the services or products for you or the needy soul will be automatically processed.  Thank you for playing your part in this world of endless Blessings.
        </p>

        <Card className="mt-8 space-y-5 border-primary-foreground/20 p-4 text-primary-foreground bg-primary/50 backdrop-blur-sm sm:p-6">
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[120px_1fr_1fr]">
              <div className="space-y-2">
                <Label htmlFor="salutation">Title</Label>
                <select
                  id="salutation"
                  value={form.salutation}
                  onChange={(e) => setForm({ ...form, salutation: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-primary-foreground/30 bg-primary-foreground/10 px-3 py-2 text-sm text-primary-foreground focus-visible:border-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                >
                  <option value="" className="text-foreground">—</option>
                  {SALUTATIONS.map((s) => (
                    <option key={s} value={s} className="text-foreground">{s}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="firstName">First name *</Label>
                <Input id="firstName" className={inputCls} maxLength={80} required
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="surname">Surname *</Label>
                <Input id="surname" className={inputCls} maxLength={80} required
                  value={form.surname}
                  onChange={(e) => setForm({ ...form, surname: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" className={inputCls} type="email" maxLength={200} required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Cell phone (optional)</Label>
                <Input id="phone" className={inputCls} type="tel" maxLength={40}
                  placeholder="+1 555 123 4567"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            {!userId && (
              <div className="space-y-2">
                <Label htmlFor="password">Create a password *</Label>
                <Input id="password" className={inputCls} type="password" minLength={6} required
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="At least 6 characters" />
                <p className="text-xs text-primary-foreground/60">
                  We'll create a recipient account so you can track your blessing.
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" className={inputCls} required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Short summary of what you need" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <select
                id="category"
                required
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                className="flex h-10 w-full rounded-md border border-primary-foreground/30 bg-primary-foreground/10 px-3 py-2 text-sm text-primary-foreground focus-visible:border-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
              >
                <option value="" className="text-foreground">Select a category</option>
                {flatCategories.map((c) => (
                  <option key={c.id} value={c.id} className="text-foreground">{c.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Describe your situation</Label>
              <Textarea id="description" rows={5} className={inputCls}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-3">
              <div>
                <Label>What kind of help do you need?</Label>
                <p className="text-xs text-primary-foreground/60">
                  Add up to 5 specific needs. Pick a type and briefly describe it.
                  Food must be vegan, pure-veg, raw-organic, or a fruit &amp; veg basket.
                </p>
              </div>
              {needs.map((n, i) => (
                <div key={i} className="space-y-2">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-[160px_1fr]">
                    <select
                      aria-label={`Help need ${i + 1} type`}
                      value={n.type}
                      onChange={(e) => updateNeed(i, { type: e.target.value, food_kind: e.target.value === "food" ? n.food_kind : undefined })}
                      className="flex h-10 w-full rounded-md border border-primary-foreground/30 bg-primary-foreground/10 px-3 py-2 text-sm text-primary-foreground focus-visible:border-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                    >
                      <option value="" className="text-foreground">Type…</option>
                      {HELP_TYPES.map((t) => (
                        <option key={t.value} value={t.value} className="text-foreground">{t.label}</option>
                      ))}
                    </select>
                    <Input
                      className={inputCls}
                      maxLength={200}
                      placeholder="Briefly describe this need"
                      value={n.details}
                      onChange={(e) => updateNeed(i, { details: e.target.value })}
                    />
                  </div>
                  {n.type === "food" && (
                    <select
                      aria-label={`Food kind for need ${i + 1}`}
                      value={n.food_kind ?? ""}
                      onChange={(e) => updateNeed(i, { food_kind: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-primary-foreground/30 bg-primary-foreground/10 px-3 py-2 text-sm text-primary-foreground focus-visible:border-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                    >
                      <option value="" className="text-foreground">Choose food kind…</option>
                      {FOOD_KINDS.map((f) => (
                        <option key={f.value} value={f.value} className="text-foreground">{f.label}</option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Label htmlFor="address_line1">Street address</Label>
              <Input id="address_line1" className={inputCls} maxLength={200}
                value={form.address_line1}
                onChange={(e) => setForm({ ...form, address_line1: e.target.value })}
                placeholder="e.g. 123 Main St, Apt 4B" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input id="country" className={inputCls}
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" className={inputCls} maxLength={120}
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input id="state" className={inputCls} maxLength={120}
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="zip">Zip</Label>
                <Input id="zip" className={inputCls} maxLength={20}
                  value={form.zip}
                  onChange={(e) => setForm({ ...form, zip: e.target.value })}
                  placeholder="e.g. 90210" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postal_code">Postal code</Label>
                <Input id="postal_code" className={inputCls} maxLength={20}
                  value={form.postal_code}
                  onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
                  placeholder="e.g. SW1A 1AA" />
              </div>
            </div>
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Submitting…" : "Submit Application"}
            </Button>
          </form>
        </Card>

        <div className="mt-10">
          <InspirationQuote variant="banner" />
        </div>
      </div>
    </div>
  );
}

