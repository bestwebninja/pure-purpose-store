import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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
  component: RequestHelp,
});

function RequestHelp() {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [tree, setTree] = useState<CategoryNode[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
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
    if (!form.title.trim() || !form.category_id) {
      toast.error("Please fill in a title and select a category.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("cases").insert({
      recipient_user_id: userId,
      title: form.title.trim(),
      description: form.description.trim() || null,
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
    toast.success("Application submitted.");
    navigate({ to: "/my-blessings" });
  };

  if (!authChecked) return <div className="mx-auto max-w-2xl px-6 py-16 text-muted-foreground">Loading…</div>;

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-display text-3xl font-semibold">Request Help</h1>
      <p className="mt-2 text-sm text-muted-foreground">Tell us what you need. Sponsors will be matched with your request.</p>

      <Card className="mt-8 p-6">
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Short summary of what you need" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <select
              id="category"
              required
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select a category</option>
              {flatCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Describe your situation</Label>
            <Textarea id="description" rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Target amount (USD)</Label>
              <Input id="amount" type="number" min="0" value={form.target_amount} onChange={(e) => setForm({ ...form, target_amount: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input id="country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="region">City / Region</Label>
            <Input id="region" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
          </div>
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Submitting…" : "Submit Application"}
          </Button>
        </form>
      </Card>
    </div>
  );
}