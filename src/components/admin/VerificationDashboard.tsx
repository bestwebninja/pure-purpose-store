import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Supplier = {
  id: string;
  name: string;
  zip: string;
  status: string;
  verification_status?: string;
  last_verified_at?: string;
  verification_source?: string;
  available_rooms?: number;
};

export function VerificationDashboard() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);

    const { data } = await supabase
      .from("accommodation_suppliers")
      .select("*")
      .order("last_verified_at", { ascending: false });

    setSuppliers((data as Supplier[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-4 sm:p-6 text-white">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 break-words">
        Live Supplier Verification Engine
      </h1>

      <button
        onClick={load}
        className="mb-4 w-full sm:w-auto px-4 py-2 bg-yellow-500 text-black rounded text-sm"
      >
        Refresh
      </button>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-3">
          {suppliers.map((s) => (
            <div
              key={s.id}
              className="border border-gray-700 p-3 rounded"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <strong className="break-words min-w-0">{s.name}</strong>
                <span className="text-sm">{s.zip}</span>
              </div>

              <div className="text-sm opacity-80 break-words">
                Status: {s.status} | Verification: {s.verification_status}
              </div>

              <div className="text-xs opacity-60 break-words">
                Last verified: {s.last_verified_at || "never"} | Source:{" "}
                {s.verification_source || "none"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
