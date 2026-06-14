import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getMyGiving } from "@/lib/gateway";

type Donation = {
  id: string;
  amount: number | string;
  currency: string;
  message: string | null;
  is_anonymous: boolean;
  created_at: string;
  campaign: { id: string; handle: string; title: string; image_url: string | null } | null;
};

export const Route = createFileRoute("/me/giving")({
  head: () => ({ meta: [{ title: "My Giving — MyBlessings" }, { name: "robots", content: "noindex" }] }),
  component: MyGiving,
});

function formatMoney(n: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
}

function MyGiving() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ donations: Donation[]; totalAmount: number; count: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) {
        navigate({ to: "/login" });
        return;
      }
      try {
        const res = await getMyGiving();
        if (!cancelled) setData(res as { donations: Donation[]; totalAmount: number; count: number });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [navigate]);

  if (loading) return <div className="mx-auto max-w-4xl px-6 py-16 text-muted-foreground">Loading…</div>;
  if (!data) return null;

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-12">
      <header>
        <h1 className="text-display text-3xl font-semibold text-primary-foreground">My Giving</h1>
        <p className="text-sm text-muted-foreground">Every blessing you've sent through MyBlessings.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Total given</p>
          <p className="mt-1 text-display text-3xl font-semibold text-primary-foreground">{formatMoney(data.totalAmount)}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Blessings</p>
          <p className="mt-1 text-display text-3xl font-semibold text-primary-foreground">{data.count}</p>
        </Card>
      </div>

      {data.donations.length === 0 ? (
        <Card className="p-10 text-center">
          <Heart className="mx-auto h-8 w-8 text-primary" />
          <p className="mt-3 text-muted-foreground">You haven't given a blessing yet.</p>
          <Button asChild className="mt-4"><Link to="/give">Give your first blessing</Link></Button>
        </Card>
      ) : (
        <Card className="divide-y divide-border/60">
          {data.donations.map((d) => (
            <div key={d.id} className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                {d.campaign ? (
                  <Link to="/campaign/$handle" params={{ handle: d.campaign.handle }} className="font-medium hover:underline">
                    {d.campaign.title}
                  </Link>
                ) : (
                  <span className="font-medium text-muted-foreground">Campaign removed</span>
                )}
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{new Date(d.created_at).toLocaleDateString()}</span>
                  {d.is_anonymous && <Badge variant="outline">Anonymous</Badge>}
                </div>
                {d.message && <p className="mt-1 text-sm text-muted-foreground italic">"{d.message}"</p>}
              </div>
              <p className="shrink-0 text-display text-lg font-semibold">{formatMoney(Number(d.amount), d.currency)}</p>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}


