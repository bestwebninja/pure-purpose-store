import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/**
 * STUB: BlessingPaymentForm. Real checkout flows through Shopify via the
 * DonationPanel on the campaign route. Exact-amount funding only —
 * partial / custom donations are not permitted.
 */
export function BlessingPaymentForm({
  campaignHandle,
  exactAmount,
  currency = "USD"
}: {
  campaignHandle?: string;
  exactAmount?: number;
  currency?: string;
}) {
  const amount = exactAmount ?? 0;
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(amount);
  return <Card className="p-6">
      <h3 className="text-display text-lg font-semibold">Give a Blessing</h3>
      <p className="mt-1 text-sm text-muted-foreground text-white">
        {campaignHandle ? `Supporting ${campaignHandle}` : "Fund the full blessing package."}
      </p>
      <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Exact funding amount
        </p>
        <p className="mt-1 text-display text-2xl font-semibold text-primary">{formatted}</p>
      </div>
      <Button type="button" className="mt-4 w-full" disabled={amount < 1} onClick={() => toast?.success?.("Stub: would redirect to Shopify checkout")}>
        {amount < 1 ? "Select a blessing to fund" : `Fund this Blessing for ${formatted}`}
      </Button>
    </Card>;
}
