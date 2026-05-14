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
  "border-white/30 bg-white/10 text-white placeholder:text-white/60 focus-visible:border-yellow-400 focus-visible:ring-yellow-300";

function RequestHelp() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [tree, setTree] = useState<CategoryNode[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    surname: "",
    email: "",
    phone: "",
    password: "",
    title: "",
    description: "",
    category_id: "",
    target_amount: "",
    country: "",
    city: "",
    state: "",
    zip: "",
    postal_code: "",
  });

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
    const { error } = await supabase.from("cases").insert({
      recipient_user_id: recipientId,
      title: form.title.trim(),
      description: [
        `Requested by: ${form.firstName.trim()} ${form.surname.trim()}`,
        `Email: ${form.email.trim()}`,
        form.phone.trim() ? `Phone: ${form.phone.trim()}` : null,
        form.city.trim() ? `City: ${form.city.trim()}` : null,
        form.state.trim() ? `State: ${form.state.trim()}` : null,
        form.zip.trim() ? `Zip: ${form.zip.trim()}` : null,
        form.postal_code.trim() ? `Postal code: ${form.postal_code.trim()}` : null,
        "",
        form.description.trim(),
      ].filter(Boolean).join("\n") || null,
      category_id: form.category_id,
      target_amount: form.target_amount ? Number(form.target_amount) : 0,
      country: form.country.trim() || null,
      region: form.state.trim() || null,
      status: "PENDING",
    });
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
          budget: form.target_amount ? Number(form.target_amount) : null,
        }),
      }).catch(() => {});
    } catch { /* noop */ }
    toast.success("Application submitted.");
    navigate({ to: "/my-blessings" });
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0a1f6b", color: "#ffffff" }}>
      <div className="mx-auto max-w-2xl px-6 py-16">
         <h1 className="text-display text-3xl font-semibold text-white">BlessME 🙏</h1>
        <p className="mt-2 text-white/80">
          Sign up as a recipient and tell us what you need. Sponsors will be matched to your request.
        </p>

        <Card
          className="mt-8 space-y-5 border-white/20 p-6 text-white"
          style={{ backgroundColor: "#0a1f6b" }}
        >
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
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
            <div className="grid grid-cols-2 gap-4">
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
                <p className="text-xs text-white/60">
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
                className="flex h-10 w-full rounded-md border border-white/30 bg-white/10 px-3 py-2 text-sm text-white focus-visible:border-yellow-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-yellow-300"
              >
                <option value="" className="text-black">Select a category</option>
                {flatCategories.map((c) => (
                  <option key={c.id} value={c.id} className="text-black">{c.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Describe your situation</Label>
              <Textarea id="description" rows={5} className={inputCls}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Target amount (USD)</Label>
                <Input id="amount" className={inputCls} type="number" min="0"
                  value={form.target_amount}
                  onChange={(e) => setForm({ ...form, target_amount: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input id="country" className={inputCls}
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
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
            <div className="grid grid-cols-2 gap-4">
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