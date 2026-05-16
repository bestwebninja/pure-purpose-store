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
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [anon, setAnon] = useState(false);
  const [loading, setLoading] = useState(false);

  // Exact-amount funding only — sponsors fund the full blessing package.
  const exactAmount = Number(campaign.goal_amount);

  const pct = Math.min(
    100,
    campaign.goal_amount > 0 ? Math.round((Number(campaign.raised_amount) / Number(campaign.goal_amount)) * 100) : 0,
  );

  const handleGive = async () => {
    if (!exactAmount || exactAmount < 1) {
      toast.error("This blessing has no target amount set");
      return;
    }
    setLoading(true);
    try {
      const [firstName = "", ...surnameParts] = name.trim().split(" ");
      const surname = surnameParts.join(" ") || "Stranger";

      const { checkoutUrl } = await checkoutFn({
        data: {
          campaignId: campaign.id,
          amount: exactAmount,
          first_name: anon ? "Anonymous" : firstName || "Kind",
          surname: anon ? "Donor" : surname,
          message: message || undefined,
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

      <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Exact funding amount
        </p>
        <p className="mt-1 text-display text-3xl font-semibold text-primary">
          {formatMoney(exactAmount, campaign.currency)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Partial donations are not accepted — sponsor the full blessing.
        </p>
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
        disabled={loading || exactAmount < 1}
        size="lg"
        className="btn-blessing w-full text-lg hover:opacity-95"
      >
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Heart className="mr-2 h-4 w-4" fill="currentColor" />}
        Fund this Blessing for {formatMoney(exactAmount, campaign.currency)}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Secure checkout powered by Shopify · 100% transparent
      </p>
    </Card>
  );
}