import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { submitNgoApplication } from "@/lib/gateway";
import { toast } from "sonner";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";

const FormSchema = z.object({
  name: z.string().min(2, "Legal name is required"),
  organization_type: z.string().min(1, "Select an organization type"),
  ein: z.string().regex(/^\d{2}-\d{7}$/, "EIN must follow XX-XXXXXXX"),
  email: z.string().email("Invalid contact email"),
  country: z.enum(["US", "IL"], { message: "Country must be United States or Israel" }),
  geography: z.string().min(2, "Geography of impact is required"),
  causes: z.array(z.string()).min(1, "Select at least one cause"),
  address_street: z.string().min(2, "Street address is required").max(255),
  address_city: z.string().min(1, "City is required").max(120),
  address_region: z.string().min(1, "State / region is required").max(120),
  address_postal_code: z.string().min(3, "Postal code is required").max(20).regex(/^[0-9A-Za-z\- ]+$/, "Postal code can include digits, letters, spaces and hyphens"),
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

const inputCls =
  "border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/60 focus-visible:border-accent focus-visible:ring-accent";

const selectTriggerCls =
  "border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground data-[placeholder]:text-primary-foreground/60 focus:ring-accent";

export const Route = createFileRoute("/ngo/onboarding")({
  component: NgoOnboardingPage,
});

function NgoOnboardingPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: { causes: [], country: "US" },
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
    <div className="min-h-screen bg-primary text-primary-foreground [&_label]:text-primary-foreground">
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-16">
      <header className="mb-8">
        <h1 className="text-display text-3xl font-semibold text-primary-foreground">Nonprofit Intake &amp; Verification 🙏</h1>
        <p className="mt-2 text-primary-foreground/80">Please complete all sections for vetting and registration.</p>

        <nav className="mt-6 flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => scrollTo("section-identity")}>1. Identity</Button>
          <Button variant="secondary" size="sm" onClick={() => scrollTo("section-mission")}>2. Mission</Button>
          <Button variant="secondary" size="sm" onClick={() => scrollTo("section-impact")}>3. Impact</Button>
        </nav>
      </header>

      <Card className="mt-4 space-y-5 border-primary-foreground/20 p-4 text-primary-foreground bg-primary/50 backdrop-blur-sm sm:p-6">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
        {/* Identity Section */}
        <section id="section-identity" className="scroll-mt-24 space-y-6">
          <div className="border-b border-primary-foreground/20 pb-2">
            <h2 className="text-xl font-bold">1. Legal Identity</h2>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Legal Name of Organization</Label>
              <Input id="name" className={inputCls} {...form.register("name")} placeholder="As registered with IRS" />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Organization Type</Label>
                <Select onValueChange={(val) => form.setValue("organization_type", val)}>
                  <SelectTrigger className={selectTriggerCls}>
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
                  className={inputCls}
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
          <div className="border-b border-primary-foreground/20 pb-2">
            <h2 className="text-xl font-bold">2. Help Interests</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {CAUSES.map((cause) => (
              <div key={cause} className="flex items-center space-x-3">
                <Checkbox
                  id={cause}
                  className="h-11 w-11 rounded-md border-2 border-primary-foreground/40 data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground"
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
          <div className="border-b border-primary-foreground/20 pb-2">
            <h2 className="text-xl font-bold">3. Contact & Impact</h2>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Public Contact Email</Label>
              <Input id="email" className={inputCls} {...form.register("email")} placeholder="contact@org.org" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="country">Country of Registration</Label>
                <Select
                  defaultValue="US"
                  onValueChange={(val) => form.setValue("country", val as "US" | "IL")}
                >
                  <SelectTrigger id="country" className={selectTriggerCls}>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US">United States</SelectItem>
                    <SelectItem value="IL">Israel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="geography">Geography of Impact</Label>
                <Input id="geography" className={inputCls} {...form.register("geography")} placeholder="e.g. US — California, Israel — Tel Aviv" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address_street">Street Address</Label>
              <Input
                id="address_street"
                className={inputCls}
                {...form.register("address_street")}
                placeholder="123 Main Street, Suite 400"
                autoComplete="street-address"
                inputMode="text"
              />
              {form.formState.errors.address_street && (
                <p className="text-xs text-destructive">{form.formState.errors.address_street.message}</p>
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="address_city">City</Label>
                <Input
                  id="address_city"
                  className={inputCls}
                  {...form.register("address_city")}
                  placeholder="City"
                  autoComplete="address-level2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address_region">State / Region</Label>
                <Input
                  id="address_region"
                  className={inputCls}
                  {...form.register("address_region")}
                  placeholder="State or region"
                  autoComplete="address-level1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address_postal_code">Postal Code</Label>
                <Input
                  id="address_postal_code"
                  className={inputCls}
                  {...form.register("address_postal_code")}
                  placeholder="e.g. 94103"
                  autoComplete="postal-code"
                  inputMode="numeric"
                  pattern="[0-9A-Za-z\- ]*"
                />
              </div>
            </div>
          </div>
        </section>

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Processing Application..." : "Submit"}
        </Button>
      </form>
      </Card>
      </div>
    </div>
  );
}


