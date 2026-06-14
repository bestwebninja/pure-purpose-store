import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FormField, FormInput, FormSelect, FormGrid } from "@/components/ui/form-control";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type SupplierType =
  | "hotel"
  | "guesthouse"
  | "hostel"
  | "airbnb_host"
  | "private_landlord";

export function AddAccommodationSupplierPanel() {
  const [form, setForm] = useState({
    name: "",
    type: "hotel" as SupplierType,
    country: "",
    city: "",
    zip: "",
    total_rooms: 0,
    available_rooms: 0,
    base_nightly_rate_usd: 0,
    vegan_meal_available: false,
    vegetarian_meal_available: false,
  });

  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  function updateField(field: string, value: any) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    setStatus("saving");

    try {
      // TEMP: replace with Supabase insert later
      console.log("NEW ACCOMMODATION SUPPLIER:", form);

      await new Promise((r) => setTimeout(r, 800));

      setStatus("saved");

      setTimeout(() => setStatus("idle"), 1500);
    } catch (e) {
      console.error(e);
      setStatus("idle");
    }
  }

  return (
    <div className="w-full rounded-xl border p-4 bg-card shadow-card">
      <h2 className="text-xl font-semibold mb-4 text-foreground">
        Add Accommodation Supplier Node
      </h2>

      <FormGrid>
        <FormField label="Supplier Name" htmlFor="acc-name">
          <FormInput id="acc-name" value={form.name} onChange={(e) => updateField("name", e.target.value)} />
        </FormField>
        <FormField label="Type" htmlFor="acc-type">
          <FormSelect id="acc-type" value={form.type} onChange={(e) => updateField("type", e.target.value)}>
            <option value="hotel">Hotel</option>
            <option value="guesthouse">Guesthouse</option>
            <option value="hostel">Hostel</option>
            <option value="airbnb_host">Airbnb Host</option>
            <option value="private_landlord">Private Landlord</option>
          </FormSelect>
        </FormField>
        <FormField label="Country" htmlFor="acc-country">
          <FormInput id="acc-country" value={form.country} onChange={(e) => updateField("country", e.target.value)} />
        </FormField>
        <FormField label="City" htmlFor="acc-city">
          <FormInput id="acc-city" value={form.city} onChange={(e) => updateField("city", e.target.value)} />
        </FormField>
        <FormField label="ZIP Code" htmlFor="acc-zip">
          <FormInput id="acc-zip" value={form.zip} onChange={(e) => updateField("zip", e.target.value)} />
        </FormField>
        <FormField label="Total Rooms" htmlFor="acc-total">
          <FormInput id="acc-total" type="number" value={form.total_rooms} onChange={(e) => updateField("total_rooms", Number(e.target.value))} />
        </FormField>
        <FormField label="Available Rooms" htmlFor="acc-avail">
          <FormInput id="acc-avail" type="number" value={form.available_rooms} onChange={(e) => updateField("available_rooms", Number(e.target.value))} />
        </FormField>
        <FormField label="Base Nightly Rate (USD)" htmlFor="acc-rate">
          <FormInput id="acc-rate" type="number" value={form.base_nightly_rate_usd} onChange={(e) => updateField("base_nightly_rate_usd", Number(e.target.value))} />
        </FormField>
      </FormGrid>

      <div className="flex gap-4 mt-4">
        <Label className="flex items-center gap-2 text-foreground">
          <Checkbox
            checked={form.vegan_meal_available}
            onCheckedChange={(v) => updateField("vegan_meal_available", v === true)}
          />
          Vegan Meals
        </Label>
        <Label className="flex items-center gap-2 text-foreground">
          <Checkbox
            checked={form.vegetarian_meal_available}
            onCheckedChange={(v) => updateField("vegetarian_meal_available", v === true)}
          />
          Vegetarian Meals
        </Label>
      </div>

      <Button
        onClick={handleSubmit}
        variant="blessing"
        className="mt-5"
        disabled={status === "saving"}
      >
        {status === "saving"
          ? "Connecting Node..."
          : status === "saved"
          ? "Supplier Connected ✓"
          : "Connect Accommodation Supplier"}
      </Button>
    </div>
  );
}
