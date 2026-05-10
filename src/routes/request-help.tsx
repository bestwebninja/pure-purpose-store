import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
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
      { title: "Request Help — MyBlessings" },
      { name: "description", content: "Tell us what you need. We'll connect you with sponsors and providers." },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/living-intake" });
  },
  component: RequestHelp,
});

const inputCls =
  "border-white/30 bg-white/10 text-white placeholder:text-white/60 focus-visible:border-yellow-400 focus-visible:ring-yellow-300";

function RequestHelp() {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [tree, setTree] = useState<CategoryNode[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    surname: "",
    email: "",
    phone: "",
    title: "",
    description: "",
    category_id: "",
    target_amount: "",
    country: "",
    region: "",
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!data.user) {
        navigate({ to: "/login" });
        return;
      }
      setUserId(data.user.id);
      setAuthChecked(true);
      if (data.user.email) {
        setForm((f) => (f.email ? f : { ...f, email: data.user!.email! }));
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
    if (!userId) return;
    if (!form.firstName.trim() || !form.surname.trim() || !form.email.trim()) {
      toast.error("Please provide your first name, surname and email.");
      return;
    }
    if (!form.title.trim() || !form.category_id) {
      toast.error("Please fill in a title and select a category.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("cases").insert({
      recipient_user_id: userId,
      title: form.title.trim(),
      description: [
        `Requested by: ${form.firstName.trim()} ${form.surname.trim()}`,
        `Email: ${form.email.trim()}`,
        form.phone.trim() ? `Phone: ${form.phone.trim()}` : null,
        "",
        form.description.trim(),
      ].filter(Boolean).join("\n") || null,
      category_id: form.category_id,
      target_amount: form.target_amount ? Number(form.target_amount) : 0,
      country: form.country.trim() || null,
      region: form.region.trim() || null,
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
          location: { city: form.region, country: form.country },
          category_ids: form.category_id ? [form.category_id] : [],
          budget: form.target_amount ? Number(form.target_amount) : null,
        }),
      }).catch(() => {});
    } catch { /* noop */ }
    toast.success("Application submitted.");
    navigate({ to: "/my-blessings" });
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#0a1f6b", color: "#ffffff" }}>
        <div className="mx-auto max-w-2xl px-6 py-16 text-white/80">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0a1f6b", color: "#ffffff" }}>
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-display text-3xl font-semibold text-white">Request Help 🙏</h1>
        <p className="mt-2 text-white/80">
          Tell us about yourself and what you need. Sponsors will be matched to your request.
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
            <div className="space-y-2">
              <Label htmlFor="region">City / Region</Label>
              <Input id="region" className={inputCls}
                value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value })} />
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