import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { submitNgoApplication } from "@/server/ngo.functions";

export const Route = createFileRoute("/ngo/onboarding")({
  head: () => ({
    meta: [
      { title: "NGO Onboarding — MyBlessings" },
      { name: "description", content: "Apply to join the MyBlessings nonprofit network in three quick steps." },
    ],
  }),
  component: Onboarding,
});

const CAUSE_OPTIONS = [
  "children-families",
  "education",
  "healthcare",
  "disaster-relief",
  "food-security",
  "elder-care",
];

function Onboarding() {
  const submit = useServerFn(submitNgoApplication);
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    firstName: "",
    surname: "",
    email: "",
    contactNumber: "",
    whatsapp: false,
    country: "",
    geography: "",
    causes: [] as string[],
  });

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const toggleCause = (c: string) => {
    update("causes", form.causes.includes(c) ? form.causes.filter((x) => x !== c) : [...form.causes, c]);
  };

  const onSubmit = async () => {
    setSubmitting(true);
    try {
      await submit({ data: form });
      toast.success("Application submitted! We'll be in touch.");
      navigate({ to: "/ngo" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "border-white/30 bg-white/10 text-white placeholder:text-white/60 focus-visible:border-yellow-400 focus-visible:ring-yellow-300";
  return (
    <div className="mx-auto max-w-2xl px-6 py-16" style={{ backgroundColor: "#0a1f6b", color: "#ffffff" }}>
      <h1 className="text-display text-3xl font-semibold text-white">NGO Onboarding</h1>
      <p className="mt-2 text-white/80">Step {step} of 3</p>

      <Card className="mt-8 space-y-5 p-6 border-white/20 text-white" style={{ backgroundColor: "#0a1f6b" }}>
        {step === 1 && (
          <>
            <div className="space-y-2">
              <Label>Organization name</Label>
              <Input className={inputCls} value={form.name} onChange={(e) => update("name", e.target.value)} maxLength={120} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First name</Label>
                <Input className={inputCls} value={form.firstName} onChange={(e) => update("firstName", e.target.value)} maxLength={80} />
              </div>
              <div className="space-y-2">
                <Label>Surname</Label>
                <Input className={inputCls} value={form.surname} onChange={(e) => update("surname", e.target.value)} maxLength={80} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Contact email</Label>
              <Input className={inputCls} type="email" value={form.email} onChange={(e) => update("email", e.target.value)} maxLength={200} />
            </div>
            <div className="space-y-2">
              <Label>Contact number</Label>
              <div className="flex items-center gap-3">
                <Input
                  className={inputCls}
                  type="tel"
                  value={form.contactNumber}
                  onChange={(e) => update("contactNumber", e.target.value)}
                  maxLength={40}
                />
                <label className="flex shrink-0 items-center gap-2 text-sm text-white">
                  <Checkbox
                    checked={form.whatsapp}
                    onCheckedChange={(v) => update("whatsapp", v === true)}
                  />
                  <span>WhatsApp</span>
                </label>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Input className={inputCls} value={form.country} onChange={(e) => update("country", e.target.value)} maxLength={80} />
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setStep(2)} disabled={!form.name || !form.email || !form.country}>Next</Button>
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <div className="space-y-2">
              <Label>Causes</Label>
              <div className="grid grid-cols-2 gap-2">
                {CAUSE_OPTIONS.map((c) => (
                  <label key={c} className="flex items-center gap-2 text-sm">
                    <Checkbox checked={form.causes.includes(c)} onCheckedChange={() => toggleCause(c)} />
                    <span className="capitalize">{c.replace(/-/g, " ")}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Geography served</Label>
              <Input className={inputCls} value={form.geography} onChange={(e) => update("geography", e.target.value)} placeholder="e.g. East Africa" maxLength={120} />
            </div>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={() => setStep(3)} disabled={form.causes.length === 0 || !form.geography}>Next</Button>
            </div>
          </>
        )}
        {step === 3 && (
          <>
            <h3 className="font-semibold">Review your application</h3>
            <dl className="space-y-2 text-sm">
              <div><dt className="text-white/70">Organization</dt><dd>{form.name}</dd></div>
              <div><dt className="text-white/70">Email</dt><dd>{form.email}</dd></div>
              <div><dt className="text-white/70">Country</dt><dd>{form.country}</dd></div>
              <div><dt className="text-white/70">Geography</dt><dd>{form.geography}</dd></div>
              <div><dt className="text-white/70">Causes</dt><dd>{form.causes.join(", ")}</dd></div>
            </dl>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
              <Button onClick={onSubmit} disabled={submitting}>{submitting ? "Submitting…" : "Submit application"}</Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}