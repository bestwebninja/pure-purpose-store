import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Heart, Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { createBlessingCheckout } from "@/server/checkout.functions";
import type { Campaign } from "@/server/campaigns.functions";

type CampaignLite = Pick<Campaign, "id" | "handle" | "title" | "currency" | "goal_amount" | "raised_amount">;

const PRESETS = [25, 50, 100, 250];

function formatMoney(n: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
}

export function DonationPanel({
  campaign,
  donorCount,
}: {
  campaign: CampaignLite;
  donorCount: number;
}) {
  const checkoutFn = useServerFn(createBlessingCheckout);
  const [amount, setAmount] = useState<number>(50);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [anon, setAnon] = useState(false);
  const [loading, setLoading] = useState(false);

  const pct = Math.min(
    100,
    campaign.goal_amount > 0 ? Math.round((Number(campaign.raised_amount) / Number(campaign.goal_amount)) * 100) : 0,
  );

  const handleGive = async () => {
    if (!amount || amount < 1) {
      toast.error("Choose a blessing amount");
      return;
    }
    setLoading(true);
    try {
      const { checkoutUrl } = await checkoutFn({
        data: {
          campaignId: campaign.id,
          amount,
          donorName: anon ? undefined : name || undefined,
          message: message || undefined,
          isAnonymous: anon,
        },
      });
      window.open(checkoutUrl, "_blank");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error("Couldn't start checkout", { description: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="space-y-6 border-border/60 p-6 shadow-card md:sticky md:top-24">
      <div className="space-y-3">
        <Progress value={pct} className="h-2" />
        <div className="flex items-baseline justify-between">
          <span className="text-display text-2xl font-semibold">
            {formatMoney(Number(campaign.raised_amount), campaign.currency)}
          </span>
          <span className="text-sm text-muted-foreground">
            of {formatMoney(Number(campaign.goal_amount), campaign.currency)}
          </span>
        </div>
        <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="h-3 w-3" /> {donorCount} blessings given
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-sm">Choose your blessing</Label>
        <div className="grid grid-cols-4 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setAmount(p)}
              className={`rounded-lg border px-2 py-3 text-sm font-semibold transition-colors ${
                amount === p
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border bg-background hover:border-primary/40"
              }`}
            >
              ${p}
            </button>
          ))}
        </div>
        <Input
          type="number"
          min={1}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          aria-label="Custom amount"
        />
      </div>

      <div className="space-y-3">
        <div>
          <Label className="text-sm">Your name {anon && <span className="text-muted-foreground">(hidden)</span>}</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="A kind stranger"
            disabled={anon}
          />
        </div>
        <div>
          <Label className="text-sm">Add a note of encouragement</Label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Thinking of you…"
            rows={3}
          />
        </div>
        <label className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Give anonymously</span>
          <Switch checked={anon} onCheckedChange={setAnon} />
        </label>
      </div>

      <Button
        onClick={handleGive}
        disabled={loading}
        size="lg"
        className="w-full bg-gradient-primary text-primary-foreground shadow-soft hover:opacity-95"
      >
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Heart className="mr-2 h-4 w-4" fill="currentColor" />}
        Give a Blessing
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Secure checkout powered by Shopify · 100% transparent
      </p>
    </Card>
  );
}