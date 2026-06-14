import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

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
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);

    const { data, error: qErr } = await supabase
      .from("accommodation_suppliers")
      .select("*")
      .order("last_verified_at", { ascending: false });

    if (qErr) {
      console.error("[VerificationDashboard] load failed", qErr);
      setError(qErr.message);
      setSuppliers([]);
      setLoading(false);
      return;
    }

    setSuppliers((data as Supplier[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-4 sm:p-6 text-primary-foreground">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 break-words">
        Live Supplier Verification Engine
      </h1>

      <Button onClick={load} variant="blessing" size="sm" className="mb-4 w-full sm:w-auto">Refresh</Button>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <div className="rounded border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive break-words">
          Failed to load suppliers: {error}
        </div>
      ) : suppliers.length === 0 ? (
        <p className="text-sm opacity-70">No suppliers found.</p>
      ) : (
        <div className="space-y-3">
          {suppliers.map((s) => (
            <div
              key={s.id}
              className="border border-border p-3 rounded"
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
