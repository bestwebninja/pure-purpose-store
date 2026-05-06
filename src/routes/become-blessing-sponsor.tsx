import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { createSponsorProfile } from "@/server/sponsor.functions";

const ROLES = ["Rabbi", "Pastor", "Minister", "Faith Giver", "Counsellor", "Community Worker"] as const;
const HELP_OPTIONS = ["Housing", "Food", "Medical", "Education", "Employment", "Counselling", "Disaster Relief", "Elder Care"];

export const Route = createFileRoute("/become-blessing-sponsor")({
  head: () => ({
    meta: [
      { title: "Become a Blessing Sponsor — MyBlessings" },
      { name: "description", content: "Sign up as a Blessing Sponsor to help connect those in need with support." },
    ],
  }),
  component: BecomeSponsor,
});

function BecomeSponsor() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [form, setForm] = useState({
    sponsor_role: "" as (typeof ROLES)[number] | "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    organization_name: "",
    organization_details: "",
    city: "",
    state: "",
    zip: "",
    country: "",
    help_interests: [] as string[],
    verification_notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setAuthed(!!data.user);
      if (data.user?.email) setForm((f) => (f.email ? f : { ...f, email: data.user!.email! }));
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setAuthed(!!s?.user);
      if (s?.user?.email) setForm((f) => (f.email ? f : { ...f, email: s.user!.email! }));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const toggleInterest = (key: string) => {
    setForm((f) => ({
      ...f,
      help_interests: f.help_interests.includes(key)
        ? f.help_interests.filter((k) => k !== key)
        : [...f.help_interests, key],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.sponsor_role) {
      toast.error("Select your role");
      return;
    }
    setSubmitting(true);
    try {
      await createSponsorProfile({ data: { ...form, sponsor_role: form.sponsor_role } });
      toast.success("Sponsor profile created");
      navigate({ to: "/sponsor/dashboard" });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (authed === false) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="text-display text-2xl font-semibold">Sign in to continue</h1>
        <p className="mt-2 text-sm text-muted-foreground">You need an account to become a Blessing Sponsor.</p>
        <Button className="mt-6" onClick={() => navigate({ to: "/login" })}>Sign in or create account</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-display text-3xl font-semibold">Become a Blessing Sponsor</h1>
      <p className="mt-2 text-sm text-muted-foreground">Tell us about yourself and how you serve your community.</p>
      <Card className="mt-8 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label>Your role</Label>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {ROLES.map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setForm({ ...form, sponsor_role: r })}
                  className={`rounded-md border px-3 py-2 text-sm transition ${
                    form.sponsor_role === r
                      ? "border-yellow-400 bg-yellow-300 font-semibold text-black shadow-[0_0_18px_rgba(250,204,21,0.85)]"
                      : "border-border hover:border-yellow-400/60"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="first_name">First name</Label>
              <Input id="first_name" className={glow} value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="last_name">Surname</Label>
              <Input id="last_name" className={glow} value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" className={glow} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" className={glow} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="org">Organisation name</Label>
              <Input id="org" className={glow} value={form.organization_name} onChange={(e) => setForm({ ...form, organization_name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input id="country" className={glow} value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" className={glow} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="state">State / Region</Label>
              <Input id="state" className={glow} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="zip">Zip / Postal</Label>
              <Input id="zip" className={glow} value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} />
            </div>
          </div>

          <div>
            <Label htmlFor="details">Organisation details</Label>
            <Textarea id="details" rows={3} className={glow} value={form.organization_details} onChange={(e) => setForm({ ...form, organization_details: e.target.value })} />
          </div>

          <div>
            <Label>Help interests</Label>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {HELP_OPTIONS.map((opt) => (
                <label key={opt} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={form.help_interests.includes(opt)} onCheckedChange={() => toggleInterest(opt)} />
                  {opt}
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="verif">Verification notes</Label>
            <Textarea id="verif" rows={3} className={glow} placeholder="Links to your organisation, references, credentials, etc." value={form.verification_notes} onChange={(e) => setForm({ ...form, verification_notes: e.target.value })} />
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Submitting…" : "Submit for verification"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

const glow =
  "border-yellow-300/70 bg-yellow-50/40 shadow-[0_0_10px_rgba(253,224,71,0.45)] focus-visible:border-yellow-400 focus-visible:ring-yellow-300 focus-visible:shadow-[0_0_18px_rgba(250,204,21,0.7)]";