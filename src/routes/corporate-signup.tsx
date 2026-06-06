import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { submitCorporateApplication } from "@/lib/gateway";
import { toast } from "sonner";
import {
  FormField,
  FormInput,
  FormSelect,
  FormTextarea,
  FormPanel,
  FormGrid,
} from "@/components/ui/form-control";

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
    <div className="min-h-screen bg-primary text-primary-foreground">
      <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8 sm:px-6 sm:py-12">
        <header className="space-y-1">
          <h1 className="text-display text-2xl font-semibold text-primary-foreground sm:text-3xl">
            Corporate Blessing Intake Portal
          </h1>
          <p className="text-sm text-primary-foreground/70">
            Tell us about your company and how you'd like to give. We'll be in touch.
          </p>
        </header>

        <FormPanel surface="dark" title="Company Details">
          <FormField surface="dark" label="Company Name" htmlFor="company_name">
            <FormInput surface="dark" id="company_name" onChange={(e) => update("company_name", e.target.value)} />
          </FormField>
          <FormField surface="dark" label="Industry" htmlFor="industry">
            <FormInput surface="dark" id="industry" onChange={(e) => update("industry", e.target.value)} />
          </FormField>
          <FormField surface="dark" label="Website" htmlFor="website">
            <FormInput surface="dark" id="website" type="url" placeholder="https://" onChange={(e) => update("website", e.target.value)} />
          </FormField>
          <FormField surface="dark" label="Company Size" htmlFor="size">
            <FormInput surface="dark" id="size" onChange={(e) => update("company_size", e.target.value)} />
          </FormField>
        </FormPanel>

        <FormPanel surface="dark" title="Point of Contact">
          <FormGrid>
            <FormField surface="dark" label="First Name" htmlFor="poc_first">
              <FormInput surface="dark" id="poc_first" onChange={(e) => update("poc_first_name", e.target.value)} />
            </FormField>
            <FormField surface="dark" label="Surname" htmlFor="poc_last">
              <FormInput surface="dark" id="poc_last" onChange={(e) => update("poc_surname", e.target.value)} />
            </FormField>
          </FormGrid>
          <FormGrid>
            <FormField surface="dark" label="Email" htmlFor="poc_email">
              <FormInput surface="dark" id="poc_email" type="email" onChange={(e) => update("poc_email", e.target.value)} />
            </FormField>
            <FormField surface="dark" label="Phone" htmlFor="poc_phone">
              <FormInput surface="dark" id="poc_phone" type="tel" onChange={(e) => update("poc_phone", e.target.value)} />
            </FormField>
          </FormGrid>
          <FormGrid>
            <FormField surface="dark" label="Department" htmlFor="poc_dept">
              <FormInput surface="dark" id="poc_dept" onChange={(e) => update("poc_department", e.target.value)} />
            </FormField>
            <FormField surface="dark" label="Role / Title" htmlFor="poc_role">
              <FormInput surface="dark" id="poc_role" onChange={(e) => update("poc_role", e.target.value)} />
            </FormField>
          </FormGrid>
        </FormPanel>

        <FormPanel surface="dark" title="Corporate Address">
          <FormField surface="dark" label="Address Line 1" htmlFor="addr1">
            <FormInput surface="dark" id="addr1" onChange={(e) => update("address_line1", e.target.value)} />
          </FormField>
          <FormField surface="dark" label="Address Line 2" htmlFor="addr2">
            <FormInput surface="dark" id="addr2" onChange={(e) => update("address_line2", e.target.value)} />
          </FormField>
          <FormGrid>
            <FormField surface="dark" label="City" htmlFor="city">
              <FormInput surface="dark" id="city" onChange={(e) => update("city", e.target.value)} />
            </FormField>
            <FormField surface="dark" label="State" htmlFor="state">
              <FormInput surface="dark" id="state" onChange={(e) => update("state", e.target.value)} />
            </FormField>
          </FormGrid>
          <FormGrid>
            <FormField surface="dark" label="ZIP Code" htmlFor="zip">
              <FormInput surface="dark" id="zip" onChange={(e) => update("zip", e.target.value)} />
            </FormField>
            <FormField surface="dark" label="Country" htmlFor="country">
              <FormInput surface="dark" id="country" onChange={(e) => update("country", e.target.value)} />
            </FormField>
          </FormGrid>
        </FormPanel>

        <FormPanel surface="dark" title="Contribution Model">
          <FormGrid>
            <FormField surface="dark" label="Contribution Type" htmlFor="ctype">
              <FormSelect surface="dark" id="ctype" defaultValue="" onChange={(e) => update("contribution_type", e.target.value)}>
                <option value="" className="text-foreground">Select…</option>
                {["Direct Funding","Employee Giving","Matched Donations","Event Sponsorship","Hybrid"].map((o) => (
                  <option key={o} value={o} className="text-foreground">{o}</option>
                ))}
              </FormSelect>
            </FormField>
            <FormField surface="dark" label="Frequency" htmlFor="cfreq">
              <FormSelect surface="dark" id="cfreq" defaultValue="" onChange={(e) => update("contribution_frequency", e.target.value)}>
                <option value="" className="text-foreground">Select…</option>
                {["One-time","Monthly","Quarterly","Annual"].map((o) => (
                  <option key={o} value={o} className="text-foreground">{o}</option>
                ))}
              </FormSelect>
            </FormField>
          </FormGrid>
          <FormField surface="dark" label="Budget Range" htmlFor="budget">
            <FormInput surface="dark" id="budget" placeholder="e.g. $10k–$50k / year" onChange={(e) => update("budget_range", e.target.value)} />
          </FormField>
        </FormPanel>

        <FormPanel surface="dark" title="Branding & Sponsorship">
          <FormGrid>
            <FormField surface="dark" label="Brand Visibility" htmlFor="bvis">
              <FormSelect surface="dark" id="bvis" defaultValue="" onChange={(e) => update("branding_interest", e.target.value)}>
                <option value="" className="text-foreground">Select…</option>
                {["Public Recognition","Co-Branded Campaigns","Internal Only","No Branding"].map((o) => (
                  <option key={o} value={o} className="text-foreground">{o}</option>
                ))}
              </FormSelect>
            </FormField>
            <FormField surface="dark" label="Sponsorship Attribution" htmlFor="sattr">
              <FormSelect surface="dark" id="sattr" defaultValue="" onChange={(e) => update("sponsorship_interest", e.target.value)}>
                <option value="" className="text-foreground">Select…</option>
                {["Full Attribution","Limited Attribution","No Attribution"].map((o) => (
                  <option key={o} value={o} className="text-foreground">{o}</option>
                ))}
              </FormSelect>
            </FormField>
          </FormGrid>
        </FormPanel>

        <FormPanel surface="dark" title="Additional Notes">
          <FormField surface="dark" htmlFor="notes">
            <FormTextarea surface="dark" id="notes" rows={4} onChange={(e) => update("notes", e.target.value)} />
          </FormField>
        </FormPanel>

        <button
          onClick={handleSubmit}
          disabled={submitting || submitted}
          className="w-full rounded-md bg-accent py-3 font-semibold text-accent-foreground hover:bg-accent/90 disabled:opacity-60"
        >
          {submitted ? "Submitted ✓" : submitting ? "Submitting…" : "Submit Corporate Application"}
        </button>
      </div>
    </div>
  );
}