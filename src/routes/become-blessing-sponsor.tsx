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
import { createSponsorProfile } from "@/lib/gateway";

 const ROLES = ["Rabbi", "Company-Sponsor", "Minister", "A Friend", "Family Member", "Good Human"] as const;
const HELP_OPTIONS = ["Housing", "Food", "Medical", "Education", "Employment", "Counselling", "Disaster Relief", "Elderly Care"];

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
      window.setTimeout(() => {
        setAuthed(!!s?.user);
        if (s?.user?.email) setForm((f) => (f.email ? f : { ...f, email: s.user!.email! }));
      }, 0);
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
    if (!authed) {
      toast.error("Please sign in to submit your sponsor application");
      navigate({ to: "/login" });
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

  return (
    <div className="mx-auto max-w-2xl px-6 py-16" style={{ backgroundColor: "#0a1f6b", color: "#ffffff" }}>
      <h1 className="text-display text-3xl font-semibold text-white">Become a Blessing Sponsor</h1>
      <p className="mt-2 text-sm text-white/80">Tell us about yourself and how you serve your community.</p>
      <Card className="mt-8 p-6 border-white/20 text-white" style={{ backgroundColor: "#0a1f6b" }}>
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
                      ? "border-accent bg-accent font-semibold text-black shadow-[0_0_18px_rgba(250,204,21,0.85)]"
                      : "border-border hover:border-accent/60"
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

          <Button type="submit" className="w-full bg-primary-glow" disabled={submitting}>
            {submitting ? "Submitting…" : "Submit for verification"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

const glow =
  "border-white/30 bg-white/10 text-white placeholder:text-white/60 focus-visible:border-accent focus-visible:ring-accent focus-visible:shadow-[0_0_18px_rgba(250,204,21,0.7)]";


