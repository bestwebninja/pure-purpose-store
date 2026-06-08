import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useServerFn } from "@tanstack/react-start";
import { getSponsorRecommendations } from "@/lib/gateway";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";

type Recommendation = {
  id: string;
  source: "petri_match" | "campaign";
  title: string;
  category: string | null;
  amount: number | null;
  currency: string;
  score: number;
  reasoning: string;
};

export function SponsorRecommendations() {
  const fetchRecs = useServerFn(getSponsorRecommendations);
  const [recs, setRecs] = useState<Recommendation[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchRecs();
      setRecs(res.recommendations as Recommendation[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load recommendations");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold text-muted-foreground">SponsorDecisionAI · Recommended for you</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Top matches ranked from open opportunities by your history and interests.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => void load()} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        </Button>
      </div>

      <div className="mt-5 space-y-3">
        {loading && !recs ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Analyzing the matching pool…</div>
        ) : error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</div>
        ) : !recs || recs.length === 0 ? (
          <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No open matches right now. Check back soon.
          </div>
        ) : (
          recs.map((r, i) => (
            <div key={`${r.source}-${r.id}`} className="rounded-lg border border-border p-4 transition-colors hover:bg-muted/30">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground">#{i + 1}</span>
                    <h3 className="truncate font-semibold">{r.title}</h3>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-[10px]">
                      {r.source === "petri_match" ? "PETRI match" : "Campaign"}
                    </Badge>
                    {r.category ? <Badge variant="secondary" className="text-[10px]">{r.category}</Badge> : null}
                    {r.amount ? <span>· {formatCurrency(r.amount, r.currency)}</span> : null}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-semibold text-primary">{r.score}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">match</div>
                </div>
              </div>
              <p className="mt-3 border-l-2 border-accent pl-3 text-sm italic text-foreground/80">
                "{r.reasoning}"
              </p>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

function formatCurrency(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${currency} ${Math.round(amount)}`;
  }
}


