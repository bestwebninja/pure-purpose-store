import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  FormField,
  FormInput,
  FormTextarea,
  FormGrid,
} from "@/components/ui/form-control";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { createSponsorProfile } from "@/lib/gateway";

 const ROLES = ["Rabbi", "Company-Sponsor", "Minister", "A Friend", "Family Member", "Good Human"] as const;
const HELP_OPTIONS = ["Housing", "Food", "Medical", "Education", "Employment", "Counselling", "Disaster Relief", "Elderly Care"];

export const Route = createFileRoute("/become-blessing-sponsor")({
  head: () => ({
    meta: [
      { title: "Become a Blessing Sponsor � MyBlessings" },
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
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-16">
      <h1 className="text-display text-2xl font-semibold sm:text-3xl">Become a Blessing Sponsor</h1>
      <p className="mt-2 text-sm text-muted-foreground">Tell us about yourself and how you serve your community.</p>
      <Card className="mt-8 p-4 text-foreground sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label className="text-foreground">Your role</Label>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {ROLES.map((r) => (
                <Button
                  type="button"
                  key={r}
                  variant={form.sponsor_role === r ? "blessing" : "outline"}
                  size="sm"
                  onClick={() => setForm({ ...form, sponsor_role: r })}
                  className="min-h-11 w-full"
                >
                  {r}
                </Button>
              ))}
            </div>
          </div>

          <FormGrid>
            <FormField surface="dark" label="First name" htmlFor="first_name">
              <FormInput surface="dark" id="first_name" required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
            </FormField>
            <FormField surface="dark" label="Surname" htmlFor="last_name">
              <FormInput surface="dark" id="last_name" required value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
            </FormField>
            <FormField surface="dark" label="Email" htmlFor="email">
              <FormInput surface="dark" id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </FormField>
            <FormField surface="dark" label="Phone" htmlFor="phone">
              <FormInput surface="dark" id="phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </FormField>
            <FormField surface="dark" label="Organisation name" htmlFor="org">
              <FormInput surface="dark" id="org" value={form.organization_name} onChange={(e) => setForm({ ...form, organization_name: e.target.value })} />
            </FormField>
            <FormField surface="dark" label="Country" htmlFor="country">
              <FormInput surface="dark" id="country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            </FormField>
            <FormField surface="dark" label="City" htmlFor="city">
              <FormInput surface="dark" id="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </FormField>
            <FormField surface="dark" label="State / Region" htmlFor="state">
              <FormInput surface="dark" id="state" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            </FormField>
            <FormField surface="dark" label="Zip / Postal" htmlFor="zip">
              <FormInput surface="dark" id="zip" value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} />
            </FormField>
          </FormGrid>

          <FormField surface="dark" label="Organisation details" htmlFor="details">
            <FormTextarea surface="dark" id="details" rows={3} value={form.organization_details} onChange={(e) => setForm({ ...form, organization_details: e.target.value })} />
          </FormField>

          <div className="space-y-2">
            <Label className="text-foreground">Help interests</Label>
            <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {HELP_OPTIONS.map((opt) => (
                <label key={opt} className="flex min-h-11 items-center gap-2 text-sm">
                  <Checkbox checked={form.help_interests.includes(opt)} onCheckedChange={() => toggleInterest(opt)} />
                  {opt}
                </label>
              ))}
            </div>
          </div>

          <FormField surface="dark" label="Verification notes" htmlFor="verif">
            <FormTextarea surface="dark" id="verif" rows={3} placeholder="Links to your organisation, references, credentials, etc." value={form.verification_notes} onChange={(e) => setForm({ ...form, verification_notes: e.target.value })} />
          </FormField>

          <Button type="submit" className="w-full bg-primary-glow" disabled={submitting}>
            {submitting ? "Submitting�" : "Submit"}
          </Button>
        </form>
      </Card>
      </div>
    </div>
  );
}

