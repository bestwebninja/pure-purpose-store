import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

type Case = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  target_amount: number;
  currency: string;
  country: string | null;
  region: string | null;
  created_at: string;
};

export const Route = createFileRoute("/my-blessings")({
  head: () => ({ meta: [{ title: "My Blessings — MyBlessings" }] }),
  component: MyBlessings,
});

function MyBlessings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState<Case[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) {
        navigate({ to: "/login" });
        return;
      }
      const { data, error } = await supabase
        .from("cases")
        .select("id,title,description,status,target_amount,currency,country,region,created_at")
        .eq("recipient_user_id", u.user.id)
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (!error && data) setCases(data as Case[]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display text-3xl font-semibold text-foreground">My Blessings</h1>
          <p className="text-sm text-muted-foreground">Your help requests and their status.</p>
        </div>
        <Button asChild>
          <Link to="/request-help">New Request</Link>
        </Button>
      </div>

      {loading ? (
        <p className="mt-10 text-muted-foreground">Loading…</p>
      ) : cases.length === 0 ? (
        <Card className="mt-10 p-8 text-center">
          <p className="text-muted-foreground">You haven't submitted any requests yet.</p>
          <Button asChild className="mt-4">
            <Link to="/request-help">Start a New Blessing Request, For Your Self or a Person you wish to help up or help along Life's Journey.</Link>
          </Button>
        </Card>
      ) : (
        <div className="mt-8 space-y-4">
          {cases.map((c) => (
            <Card key={c.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold">{c.title}</h3>
                  {c.description && <p className="mt-1 text-sm text-muted-foreground text-slate-300">{c.description}</p>}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {[c.region, c.country].filter(Boolean).join(", ") || "Location not set"}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant={c.status === "APPROVED" ? "default" : "secondary"}>{c.status}</Badge>
                  <div className="mt-2 text-sm font-medium">
                    {c.currency} {Number(c.target_amount).toFixed(0)}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

