import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { submitCorporateApplication } from "@/lib/gateway";
import { toast } from "sonner";

export const Route = createFileRoute("/corporate-signup")({
  component: CorporateSignup,
});

function CorporateSignup() {
  const submitFn = useServerFn(submitCorporateApplication);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    company_name: "",
    industry: "",
    website: "",

    poc_first_name: "",
    poc_surname: "",
    poc_email: "",
    poc_phone: "",
    poc_department: "",
    poc_role: "",

    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    zip: "",
    country: "",

    company_size: "",

    contribution_type: "",
    contribution_frequency: "",

    sponsorship_interest: "",
    branding_interest: "",

    budget_range: "",
    notes: "",
  });

  const update = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!form.company_name || !form.poc_email) {
      toast.error("Company name and contact email are required");
      return;
    }
    setSubmitting(true);
    try {
      const poc_name = `${form.poc_first_name} ${form.poc_surname}`.trim();
      await submitFn({
        data: {
          company_name: form.company_name,
          industry: form.industry,
          website: form.website,
          poc_name,
          poc_email: form.poc_email,
          poc_phone: form.poc_phone,
          poc_department: form.poc_department,
          poc_role: form.poc_role,
          address_line1: form.address_line1,
          address_line2: form.address_line2,
          city: form.city,
          state: form.state,
          zip: form.zip,
          country: form.country,
          company_size: form.company_size,
          contribution_type: form.contribution_type,
          contribution_frequency: form.contribution_frequency,
          sponsorship_interest: form.sponsorship_interest,
          branding_interest: form.branding_interest,
          budget_range: form.budget_range,
          notes: form.notes,
        },
      });
      setSubmitted(true);
      toast.success("Application submitted. We'll be in touch.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary text-primary-foreground px-6 py-10">
      <div className="max-w-2xl mx-auto space-y-6">

        <h1 className="text-2xl font-bold text-white">
          Corporate Blessing Intake Portal
        </h1>

        <Section title="Company Details">
          <Input label="Company Name" onChange={(v: string) => update("company_name", v)} />
          <Input label="Industry" onChange={(v: string) => update("industry", v)} />
          <Input label="Website" onChange={(v: string) => update("website", v)} />
          <Input label="Company Size" onChange={(v: string) => update("company_size", v)} />
        </Section>

        {/* ✅ FIXED POC SECTION */}
        <Section title="Point of Contact">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              onChange={(v: string) => update("poc_first_name", v)}
            />
            <Input
              label="Surname"
              onChange={(v: string) => update("poc_surname", v)}
            />
          </div>

          <Input label="Email" onChange={(v: string) => update("poc_email", v)} />
          <Input label="Phone" onChange={(v: string) => update("poc_phone", v)} />
          <Input label="Department" onChange={(v: string) => update("poc_department", v)} />
          <Input label="Role / Title" onChange={(v: string) => update("poc_role", v)} />
        </Section>

        <Section title="Corporate Address">
          <Input label="Address Line 1" onChange={(v: string) => update("address_line1", v)} />
          <Input label="Address Line 2" onChange={(v: string) => update("address_line2", v)} />

          <div className="grid grid-cols-2 gap-3">
            <Input label="City" onChange={(v: string) => update("city", v)} />
            <Input label="State" onChange={(v: string) => update("state", v)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="ZIP Code" onChange={(v: string) => update("zip", v)} />
            <Input label="Country" onChange={(v: string) => update("country", v)} />
          </div>
        </Section>

        <Section title="Contribution Model">
          <Select
            label="Contribution Type"
            options={[
              "Direct Funding",
              "Employee Giving",
              "Matched Donations",
              "Event Sponsorship",
              "Hybrid",
            ]}
            onChange={(v: string) => update("contribution_type", v)}
          />

          <Select
            label="Frequency"
            options={["One-time", "Monthly", "Quarterly", "Annual"]}
            onChange={(v: string) => update("contribution_frequency", v)}
          />

          <Input label="Budget Range" onChange={(v: string) => update("budget_range", v)} />
        </Section>

        <Section title="Branding & Sponsorship">
          <Select
            label="Brand Visibility"
            options={[
              "Public Recognition",
              "Co-Branded Campaigns",
              "Internal Only",
              "No Branding",
            ]}
            onChange={(v: string) => update("branding_interest", v)}
          />

          <Select
            label="Sponsorship Attribution"
            options={[
              "Full Attribution",
              "Limited Attribution",
              "No Attribution",
            ]}
            onChange={(v: string) => update("sponsorship_interest", v)}
          />
        </Section>

        <Section title="Additional Notes">
          <textarea
            className="w-full border border-white/20 bg-white/5 text-white p-3 rounded
                       focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-accent"
            onChange={(e) => update("notes", e.target.value)}
          />
        </Section>

        <button
          onClick={handleSubmit}
          disabled={submitting || submitted}
          className="w-full rounded bg-accent py-3 font-semibold text-accent-foreground hover:bg-accent/90 disabled:opacity-60"
        >
          {submitted
            ? "Submitted ✓"
            : submitting
            ? "Submitting…"
            : "Submit Corporate Application"}
        </button>

      </div>
    </div>
  );
}

/* ---------------- UI HELPERS ---------------- */

function Section({ title, children }: any) {
  return (
    <div className="border border-white/10 bg-white/5 rounded p-4 space-y-3">
      <h2 className="text-white font-semibold">{title}</h2>
      {children}
    </div>
  );
}

function Input({ label, onChange }: any) {
  return (
    <div className="space-y-1">
      <label className="text-sm text-white/80">{label}</label>
      <input
        className="w-full border border-white/20 bg-white/5 text-white p-2 rounded
                   focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-accent"
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function Select({ label, options, onChange }: any) {
  return (
    <div className="space-y-1">
      <label className="text-sm text-white/80">{label}</label>
      <select
        className="w-full border border-white/20 bg-white/5 text-white p-2 rounded
                   focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-accent"
        onChange={(e) => onChange(e.target.value)}
        defaultValue=""
      >
        <option value="">Select...</option>
        {options.map((o: string) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}