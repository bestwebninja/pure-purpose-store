import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/corporate-signup")({
  component: CorporateSignup,
});

function CorporateSignup() {
  const [form, setForm] = useState({
    company_name: "",
    industry: "",
    website: "",
    poc_name: "",
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

  const handleSubmit = () => {
    console.log("CORPORATE APPLICATION:", form);
    alert("Corporate application submitted (MVP mode)");
  };

  return (
    <div className="min-h-screen bg-[#0B1B3A] text-white px-6 py-10">
      <div className="max-w-2xl mx-auto space-y-6">

        <h1 className="text-2xl font-bold text-white">
          Corporate Blessing Intake Portal
        </h1>

        <Section title="Company Details">
          <Input label="Company Name" onChange={(v) => update("company_name", v)} />
          <Input label="Industry" onChange={(v) => update("industry", v)} />
          <Input label="Website" onChange={(v) => update("website", v)} />
          <Input label="Company Size" onChange={(v) => update("company_size", v)} />
        </Section>

        <Section title="Point of Contact">
          <Input label="Full Name" onChange={(v) => update("poc_name", v)} />
          <Input label="Email" onChange={(v) => update("poc_email", v)} />
          <Input label="Phone" onChange={(v) => update("poc_phone", v)} />
          <Input label="Department" onChange={(v) => update("poc_department", v)} />
          <Input label="Role / Title" onChange={(v) => update("poc_role", v)} />
        </Section>

        <Section title="Corporate Address">
          <Input label="Address Line 1" onChange={(v) => update("address_line1", v)} />
          <Input label="Address Line 2" onChange={(v) => update("address_line2", v)} />

          <div className="grid grid-cols-2 gap-3">
            <Input label="City" onChange={(v) => update("city", v)} />
            <Input label="State" onChange={(v) => update("state", v)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="ZIP Code" onChange={(v) => update("zip", v)} />
            <Input label="Country" onChange={(v) => update("country", v)} />
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
            onChange={(v) => update("contribution_type", v)}
          />

          <Select
            label="Frequency"
            options={["One-time", "Monthly", "Quarterly", "Annual"]}
            onChange={(v) => update("contribution_frequency", v)}
          />

          <Input label="Budget Range" onChange={(v) => update("budget_range", v)} />
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
            onChange={(v) => update("branding_interest", v)}
          />

          <Select
            label="Sponsorship Attribution"
            options={[
              "Full Attribution",
              "Limited Attribution",
              "No Attribution",
            ]}
            onChange={(v) => update("sponsorship_interest", v)}
          />
        </Section>

        <Section title="Additional Notes">
          <textarea
            className="w-full border border-white/20 bg-white/5 text-white p-3 rounded
                       placeholder:text-white/40 focus:outline-none
                       focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
            onChange={(e) => update("notes", e.target.value)}
          />
        </Section>

        <button
          onClick={handleSubmit}
          className="w-full bg-black hover:bg-gray-900 text-white py-3 rounded font-semibold"
        >
          Submit Corporate Application
        </button>

      </div>
    </div>
  );
}

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
                   focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
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
                   focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
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