import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

/**
 * STUB: BlessingPaymentForm. Real checkout flows through Shopify
 * (see GiveBlessingButton + /api/public/shopify-webhook). This form
 * exists so dashboards can render a payment surface; replace with
 * Shopify Storefront cart creation when wired.
 */
export function BlessingPaymentForm({ campaignHandle }: { campaignHandle?: string }) {
  const [amount, setAmount] = useState(25);
  const [submitting, setSubmitting] = useState(false);

  return (
    <Card className="p-6">
      <h3 className="text-display text-lg font-semibold">Give a Blessing</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {campaignHandle ? `Supporting ${campaignHandle}` : "Pick an amount to bless someone today."}
      </p>
      <form
        className="mt-4 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitting(true);
          // TODO: hand off to Shopify Storefront cart -> checkout
          setTimeout(() => {
            setSubmitting(false);
            toast?.success?.("Stub: would redirect to Shopify checkout");
          }, 400);
        }}
      >
        <div className="grid grid-cols-4 gap-2">
          {[10, 25, 50, 100].map((v) => (
            <Button key={v} type="button" variant={amount === v ? "default" : "outline"} onClick={() => setAmount(v)}>
              ${v}
            </Button>
          ))}
        </div>
        <div>
          <Label htmlFor="amt">Custom amount</Label>
          <Input id="amt" type="number" min={1} value={amount} onChange={(e) => setAmount(Number(e.target.value) || 0)} />
        </div>
        <Button type="submit" className="w-full" disabled={submitting || amount < 1}>
          {submitting ? "Redirecting…" : `Bless with $${amount}`}
        </Button>
      </form>
    </Card>
  );
}