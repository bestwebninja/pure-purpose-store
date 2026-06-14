import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { InspirationQuote } from "@/components/site/InspirationQuote";

type CategoryNode = {
  id: string;
  parent_id: string | null;
  slug: string;
  name: string;
  children: CategoryNode[];
};

export const Route = createFileRoute("/give-a-blessing")({
  head: () => ({
    meta: [
      { title: "Configure a Blessing — MyBlessings" },
      { name: "description", content: "Sponsor someone in need. Configure your blessing in a minute." },
      { property: "og:title", content: "Configure a Blessing — MyBlessings" },
      { property: "og:description", content: "Sponsor someone in need. Configure your blessing in a minute." },
      { property: "og:url", content: "https://pure-purpose-store.lovable.app/give-a-blessing" },
    ],
    links: [{ rel: "canonical", href: "https://pure-purpose-store.lovable.app/give-a-blessing" }],
  }),
  component: GiveABlessing,
});

const sponsorSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  surname: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
});

const STEPS = ["Sponsor a good cause.... ", "Blessing Type", "Location", "Budget", "Review"] as const;

const inputCls =
  "border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/60 focus-visible:border-accent focus-visible:ring-accent";

// CTA style locked to the header "Give a Blessing" button: light blue + white.
const ctaCls = "";

function GiveABlessing() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [tree, setTree] = useState<CategoryNode[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    surname: "",
    email: "",
    phone: "",
    profileImage: "",
    facebookConnected: false,
    selectedCategoryIds: [] as string[],
    countries: "",
    state: "",
    city: "",
    zip: "",
    totalBudget: 250,
    splitAccommodation: 40,
    splitFood: 40,
    splitTransport: 20,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/categories/tree", { credentials: "include" });
        const json = await res.json();
        if (!cancelled) setTree((json?.tree ?? []) as CategoryNode[]);
      } catch {
        // noop
      }
      const { data } = await supabase.auth.getUser();
      if (!cancelled && data.user?.email) {
        setForm((f) => (f.email ? f : { ...f, email: data.user!.email! }));
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const flatCats = useMemo(
    () =>
      tree.flatMap((root) => [
        { id: root.id, label: root.name, isRoot: true },
        ...root.children.map((c) => ({ id: c.id, label: `${root.name} › ${c.name}`, isRoot: false })),
      ]),
    [tree],
  );

  const toggleCategory = (id: string) => {
    setForm((f) => {
      const has = f.selectedCategoryIds.includes(id);
      if (has) return { ...f, selectedCategoryIds: f.selectedCategoryIds.filter((x) => x !== id) };
      if (f.selectedCategoryIds.length >= 3) {
        toast.error("You can select up to 3 blessing types.");
        return f;
      }
      return { ...f, selectedCategoryIds: [...f.selectedCategoryIds, id] };
    });
  };

  const normalizeSplit = (kind: "splitAccommodation" | "splitFood" | "splitTransport", value: number) => {
    setForm((f) => {
      const newF = { ...f, [kind]: value };
      const sum = newF.splitAccommodation + newF.splitFood + newF.splitTransport;
      if (sum === 0) return newF;
      // Rescale others proportionally to keep total at 100
      const others = (["splitAccommodation", "splitFood", "splitTransport"] as const).filter((k) => k !== kind);
      const remaining = 100 - value;
      const otherSum = others.reduce((s, k) => s + newF[k], 0);
      if (otherSum === 0) {
        newF[others[0]] = Math.round(remaining / 2);
        newF[others[1]] = remaining - newF[others[0]];
      } else {
        newF[others[0]] = Math.round((newF[others[0]] / otherSum) * remaining);
        newF[others[1]] = remaining - newF[others[0]];
      }
      return newF;
    });
  };

  const allocation = {
    accommodation: Math.round((form.totalBudget * form.splitAccommodation) / 100),
    food: Math.round((form.totalBudget * form.splitFood) / 100),
    transport: Math.round((form.totalBudget * form.splitTransport) / 100),
  };

  const onSubmit = async () => {
    const sponsor = sponsorSchema.safeParse({
      firstName: form.firstName,
      surname: form.surname,
      email: form.email,
      phone: form.phone,
    });
    if (!sponsor.success) {
      toast.error("Please complete sponsor details correctly.");
      setStep(0);
      return;
    }
    if (form.selectedCategoryIds.length === 0) {
      toast.error("Choose at least one blessing type.");
      setStep(1);
      return;
    }
    if (!form.zip.trim()) {
      toast.error("ZIP / postal code is required.");
      setStep(2);
      return;
    }
    if (!form.totalBudget || form.totalBudget < 1) {
      toast.error("Enter a total budget.");
      setStep(3);
      return;
    }

    setSubmitting(true);
    try {
      // Single source of truth for the in-flight blessing intent.
      // Stored in sessionStorage (temporary session only) so the existing
      // Shopify checkout flow at /give can read one canonical object.
      // No DB writes here — Shopify confirmation is what creates persistent records.
      const intent = {
        ...form,
        allocation,
        createdAt: new Date().toISOString(),
      };
      window.sessionStorage.setItem("myblessings.blessingIntent", JSON.stringify(intent));
      // Non-blocking Petri Bloom signal — never blocks Shopify checkout.
      try {
        void fetch("/api/public/petri-bloom", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source_type: "intent",
            location: { zip: form.zip, city: form.city, country: form.countries },
            category_ids: form.selectedCategoryIds,
            budget: form.totalBudget,
          }),
        }).catch(() => {});
      } catch { /* noop */ }
      toast.success("Blessing saved. Continue to checkout to complete it.");
      navigate({ to: "/give" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary text-primary-foreground [&_label]:text-primary-foreground">
      <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-16">
        <h1 className="text-display text-3xl font-semibold text-primary-foreground">Give a Blessing 🙏</h1>
        <p className="mt-2 text-primary-foreground/80">
          Step {step + 1} of {STEPS.length} &nbsp; &#123; {STEPS[step]} &#125;
        </p>

        <Card className="mt-8 space-y-5 border-primary-foreground/20 bg-primary p-4 text-primary-foreground sm:p-6">
          {step === 0 && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>First name</Label>
                  <Input className={inputCls} value={form.firstName} maxLength={80}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Surname</Label>
                  <Input className={inputCls} value={form.surname} maxLength={80}
                    onChange={(e) => setForm({ ...form, surname: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input className={inputCls} type="email" value={form.email} maxLength={200}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input className={inputCls} type="tel" value={form.phone} maxLength={40}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Profile image URL (optional)</Label>
                <Input className={inputCls} value={form.profileImage} maxLength={500}
                  placeholder="https://…"
                  onChange={(e) => setForm({ ...form, profileImage: e.target.value })} />
                <p className="text-xs text-primary-foreground/60">Upload our drop a link to your public profile .</p>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={form.facebookConnected}
                  onCheckedChange={(v) => setForm({ ...form, facebookConnected: v === true })} />
                <span>Connect your social accounts will be an option next</span>
              </label>
              <div className="flex justify-end">
                <Button variant="blessing" onClick={() => setStep(1)}
                  disabled={!form.firstName || !form.surname || !form.email}>Next</Button>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label>Pick up to 3 blessing types</Label>
                {flatCats.length === 0 ? (
                  <p className="text-sm text-primary-foreground/70">Loading categories…</p>
                ) : (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {flatCats.map((c) => (
                      <label key={c.id}
                        className={`flex items-center gap-2 rounded-md border border-primary-foreground/20 px-3 py-2 text-sm ${
                          c.isRoot ? "font-semibold" : "pl-6"
                        }`}>
                        <Checkbox
                          checked={form.selectedCategoryIds.includes(c.id)}
                          onCheckedChange={() => toggleCategory(c.id)}
                        />
                        <span>{c.label}</span>
                      </label>
                    ))}
                  </div>
                )}
                <p className="text-xs text-primary-foreground/60">
                  Selected: {form.selectedCategoryIds.length}/3
                </p>
              </div>
              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep(0)}>Back</Button>
                <Button variant="blessing" onClick={() => setStep(2)} disabled={form.selectedCategoryIds.length === 0}>Next</Button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-2">
                <Label>Country / countries</Label>
                <Input className={inputCls} value={form.countries} maxLength={200}
                  placeholder="e.g. USA, Mexico"
                  onChange={(e) => setForm({ ...form, countries: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input className={inputCls} value={form.state} maxLength={80}
                    onChange={(e) => setForm({ ...form, state: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input className={inputCls} value={form.city} maxLength={80}
                    onChange={(e) => setForm({ ...form, city: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>ZIP / postal code *</Label>
                <Input className={inputCls} value={form.zip} maxLength={20}
                  onChange={(e) => setForm({ ...form, zip: e.target.value })} required />
                <p className="text-xs text-primary-foreground/60">Used to match recipients near you.</p>
              </div>
              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                <Button variant="blessing" onClick={() => setStep(3)} disabled={!form.zip.trim()}>Next</Button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="space-y-2">
                <Label>Total budget (USD) *</Label>
                <Input className={inputCls} type="number" min={1} value={form.totalBudget}
                  onChange={(e) => setForm({ ...form, totalBudget: Math.max(0, Number(e.target.value)) })} />
              </div>
              {(["splitAccommodation", "splitFood", "splitTransport"] as const).map((k) => {
                const label = { splitAccommodation: "Accommodation", splitFood: "Food", splitTransport: "Transport" }[k];
                return (
                  <div key={k} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{label}</span>
                      <span className="font-medium">{form[k]}%</span>
                    </div>
                    <Slider value={[form[k]]} max={100} step={1}
                      onValueChange={(v) => normalizeSplit(k, v[0])} />
                  </div>
                );
              })}
              <div className="rounded-md border border-accent/50 bg-accent/10 p-4">
                <h4 className="text-sm font-semibold text-accent">Blessings Allocation Summary</h4>
                <ul className="mt-2 space-y-1 text-sm text-primary-foreground/90">
                  <li>Accommodation: <span className="font-semibold">${allocation.accommodation}</span></li>
                  <li>Food: <span className="font-semibold">${allocation.food}</span></li>
                  <li>Transport: <span className="font-semibold">${allocation.transport}</span></li>
                  <li className="border-t border-primary-foreground/20 pt-1">Total: <span className="font-semibold">${form.totalBudget}</span></li>
                </ul>
              </div>
              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
                <Button variant="blessing" onClick={() => setStep(4)} disabled={form.totalBudget < 1}>Next</Button>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h3 className="font-semibold">Review your blessing</h3>
              <dl className="space-y-2 text-sm">
                <div><dt className="text-primary-foreground/70">Sponsor</dt><dd>{form.firstName} {form.surname} ({form.email})</dd></div>
                <div><dt className="text-primary-foreground/70">Blessing types</dt><dd>{form.selectedCategoryIds.length} selected</dd></div>
                <div><dt className="text-primary-foreground/70">Location</dt><dd>{[form.city, form.state, form.zip, form.countries].filter(Boolean).join(", ")}</dd></div>
                <div><dt className="text-primary-foreground/70">Total budget</dt><dd>${form.totalBudget}</dd></div>
                <div><dt className="text-primary-foreground/70">Split</dt>
                  <dd>Accom ${allocation.accommodation} · Food ${allocation.food} · Transport ${allocation.transport}</dd>
                </div>
              </dl>
              <p className="text-xs text-primary-foreground/60">
                Submitting saves your blessing and takes you to the existing Shopify checkout.
              </p>
              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep(3)}>Back</Button>
                <Button variant="blessing" onClick={onSubmit} disabled={submitting}>
                  {submitting ? "Saving…" : "Submit & Continue to Checkout"}
                </Button>
              </div>
            </>
          )}
        </Card>

        <div className="mt-10">
          <InspirationQuote variant="banner" />
        </div>
      </div>
    </div>
  );
}

