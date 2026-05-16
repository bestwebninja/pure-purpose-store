import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { submitNgoApplication } from "../server/ngo.functions.server";
import { toast } from "sonner";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const FormSchema = z.object({
  name: z.string().min(2, "Legal name is required"),
  organization_type: z.string().min(1, "Select an organization type"),
  ein: z.string().regex(/^\d{2}-\d{7}$/, "EIN must follow XX-XXXXXXX"),
  email: z.string().email("Invalid contact email"),
  country: z.string().min(2, "Country is required"),
  geography: z.string().min(2, "Geography of impact is required"),
  causes: z.array(z.string()).min(1, "Select at least one cause"),
});

const NTEE_CATEGORIES = [
  { label: "A - Arts, Culture & Humanities", value: "A" },
  { label: "B - Education", value: "B" },
  { label: "C - Environmental Quality", value: "C" },
  { label: "D - Animal-Related", value: "D" },
  { label: "E - Health Care", value: "E" },
  { label: "F - Mental Health", value: "F" },
  { label: "G - Voluntary Health Associations", value: "G" },
  { label: "H - Medical Research", value: "H" },
  { label: "I - Crime & Legal-Related", value: "I" },
  { label: "J - Employment", value: "J" },
  { label: "K - Food, Agriculture & Nutrition", value: "K" },
  { label: "L - Housing & Shelter", value: "L" },
  { label: "M - Public Safety", value: "M" },
  { label: "N - Recreation & Sports", value: "N" },
  { label: "O - Youth Development", value: "O" },
  { label: "P - Human Services", value: "P" },
  { label: "Q - International, Foreign Affairs", value: "Q" },
  { label: "R - Civil Rights, Social Action", value: "R" },
  { label: "S - Community Improvement", value: "S" },
  { label: "T - Philanthropy & Voluntarism", value: "T" },
  { label: "U - Science & Technology", value: "U" },
  { label: "V - Social Science", value: "V" },
  { label: "W - Public & Societal Benefit", value: "W" },
  { label: "X - Religion-Related", value: "X" },
  { label: "Y - Mutual/Membership Benefit", value: "Y" },
];

const CAUSES = ["Elderly Care", "Children", "Education", "Clean Water", "Emergency Relief", "Medical", "Animals", "Environment"];

export const Route = createFileRoute("/ngo/onboarding")({
  component: NgoOnboardingPage,
});

function NgoOnboardingPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: { causes: [] },
  });

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    setIsSubmitting(true);
    try {
      await submitNgoApplication({ data });
      toast.success("Application submitted successfully! A receipt has been sent to your email.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-12">
        <h1 className="text-display text-4xl font-semibold">Nonprofit Intake & Verification</h1>
        <p className="mt-2 text-muted-foreground">Please complete all sections for vetting and registration.</p>
        
        <nav className="mt-6 flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={() => scrollTo("section-identity")}>1. Identity</Button>
          <Button variant="ghost" size="sm" onClick={() => scrollTo("section-mission")}>2. Mission</Button>
          <Button variant="ghost" size="sm" onClick={() => scrollTo("section-impact")}>3. Impact</Button>
        </nav>
      </header>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-16">
        {/* Identity Section */}
        <section id="section-identity" className="scroll-mt-24 space-y-6">
          <div className="border-b pb-2">
            <h2 className="text-xl font-bold">1. Legal Identity</h2>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Legal Name of Organization</Label>
              <Input id="name" {...form.register("name")} placeholder="As registered with IRS" />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Organization Type</Label>
                <Select onValueChange={(val) => form.setValue("organization_type", val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select IRS/NTEE Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="h-60">
                      {NTEE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ein">EIN (XX-XXXXXXX)</Label>
                <Input 
                  id="ein" 
                  {...form.register("ein")} 
                  placeholder="00-0000000"
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 9);
                    const masked = val.length > 2 ? `${val.slice(0, 2)}-${val.slice(2)}` : val;
                    e.target.value = masked;
                    form.setValue("ein", masked);
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section id="section-mission" className="scroll-mt-24 space-y-6">
          <div className="border-b pb-2">
            <h2 className="text-xl font-bold">2. Help Interests</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {CAUSES.map((cause) => (
              <div key={cause} className="flex items-center space-x-3">
                <Checkbox
                  id={cause}
                  className="h-11 w-11 rounded-md border-2" // Guaranteed 44px hit box
                  onCheckedChange={(checked) => {
                    const current = form.getValues("causes");
                    form.setValue("causes", checked ? [...current, cause] : current.filter(c => c !== cause));
                  }}
                />
                <Label htmlFor={cause} className="cursor-pointer text-base select-none">{cause}</Label>
              </div>
            ))}
          </div>
        </section>

        {/* Contact/Impact Section */}
        <section id="section-impact" className="scroll-mt-24 space-y-6">
          <div className="border-b pb-2">
            <h2 className="text-xl font-bold">3. Contact & Impact</h2>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Public Contact Email</Label>
              <Input id="email" {...form.register("email")} placeholder="contact@org.org" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="country">Country of Registration</Label>
                <Input id="country" {...form.register("country")} placeholder="e.g. United States" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="geography">Geography of Impact</Label>
                <Input id="geography" {...form.register("geography")} placeholder="e.g. Worldwide, Local" />
              </div>
            </div>
          </div>
        </section>

        <Button type="submit" size="xl" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Processing Application..." : "Submit Application & Generate Receipt"}
        </Button>
      </form>
    </div>
  );
}