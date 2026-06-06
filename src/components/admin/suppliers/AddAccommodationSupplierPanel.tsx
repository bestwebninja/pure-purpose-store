import { useState } from "react";

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
      <h2 className="text-xl font-semibold mb-4">
        Add Accommodation Supplier Node
      </h2>

      <div className="grid grid-cols-2 gap-3">
        <input
          placeholder="Supplier Name"
          className="border p-2 rounded"
          value={form.name}
          onChange={(e) => updateField("name", e.target.value)}
        />

        <select
          className="border p-2 rounded"
          value={form.type}
          onChange={(e) => updateField("type", e.target.value)}
        >
          <option value="hotel">Hotel</option>
          <option value="guesthouse">Guesthouse</option>
          <option value="hostel">Hostel</option>
          <option value="airbnb_host">Airbnb Host</option>
          <option value="private_landlord">Private Landlord</option>
        </select>

        <input
          placeholder="Country"
          className="border p-2 rounded"
          value={form.country}
          onChange={(e) => updateField("country", e.target.value)}
        />

        <input
          placeholder="City"
          className="border p-2 rounded"
          value={form.city}
          onChange={(e) => updateField("city", e.target.value)}
        />

        <input
          placeholder="ZIP Code"
          className="border p-2 rounded"
          value={form.zip}
          onChange={(e) => updateField("zip", e.target.value)}
        />

        <input
          type="number"
          placeholder="Total Rooms"
          className="border p-2 rounded"
          value={form.total_rooms}
          onChange={(e) =>
            updateField("total_rooms", Number(e.target.value))
          }
        />

        <input
          type="number"
          placeholder="Available Rooms"
          className="border p-2 rounded"
          value={form.available_rooms}
          onChange={(e) =>
            updateField("available_rooms", Number(e.target.value))
          }
        />

        <input
          type="number"
          placeholder="Base Nightly Rate (USD)"
          className="border p-2 rounded"
          value={form.base_nightly_rate_usd}
          onChange={(e) =>
            updateField("base_nightly_rate_usd", Number(e.target.value))
          }
        />
      </div>

      <div className="flex gap-4 mt-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.vegan_meal_available}
            onChange={(e) =>
              updateField("vegan_meal_available", e.target.checked)
            }
          />
          Vegan Meals
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.vegetarian_meal_available}
            onChange={(e) =>
              updateField("vegetarian_meal_available", e.target.checked)
            }
          />
          Vegetarian Meals
        </label>
      </div>

      <button
        onClick={handleSubmit}
        className="mt-5 px-4 py-2 rounded bg-primary text-primary-foreground"
        disabled={status === "saving"}
      >
        {status === "saving"
          ? "Connecting Node..."
          : status === "saved"
          ? "Supplier Connected ✓"
          : "Connect Accommodation Supplier"}
      </button>
    </div>
  );
}
