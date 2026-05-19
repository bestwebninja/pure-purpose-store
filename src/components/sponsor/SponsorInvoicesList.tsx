import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listSponsorInvoices } from "@/server/invoicing.functions";

type Invoice = {
  id: string;
  invoice_number: string;
  gross_amount: number;
  donation_amount: number;
  platform_fee_amount: number;
  currency: string;
  status: string;
  issued_at: string;
};

function formatCurrency(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function downloadInvoice(inv: Invoice) {
  const lines = [
    `MyBlessings â€” Tax Receipt & Platform Invoice`,
    `Invoice #: ${inv.invoice_number}`,
    `Issued:    ${new Date(inv.issued_at).toLocaleDateString()}`,
    `Currency:  ${inv.currency}`,
    ``,
    `Gross contribution:        ${formatCurrency(inv.gross_amount, inv.currency)}`,
    `Tax-deductible donation:   ${formatCurrency(inv.donation_amount, inv.currency)}  (93.5%)`,
    `Platform software fee:     ${formatCurrency(inv.platform_fee_amount, inv.currency)}  (6.5%)`,
    ``,
    `Status: ${inv.status}`,
  ].join("\n");
  const blob = new Blob([lines], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${inv.invoice_number}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function SponsorInvoicesList() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const res = await listSponsorInvoices({ data: {} });
      setInvoices(res.invoices as Invoice[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-display text-lg font-semibold">Tax Receipts & Invoices</h2>
          <p className="text-sm text-muted-foreground">
            Each contribution is split into a 93.5% tax-deductible donation and a 6.5% platform fee.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
          {loading ? "Refreshingâ€¦" : "Refresh"}
        </Button>
      </div>

      {error ? (
        <p className="mt-4 text-sm text-destructive">{error}</p>
      ) : loading ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading invoicesâ€¦</p>
      ) : invoices.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No invoices yet. They'll appear here as your contributions settle.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="py-2 pr-4">Invoice</th>
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Gross</th>
                <th className="py-2 pr-4">Donation (93.5%)</th>
                <th className="py-2 pr-4">Platform fee (6.5%)</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4" />
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-t border-border/60">
                  <td className="py-2 pr-4 font-medium">{inv.invoice_number}</td>
                  <td className="py-2 pr-4 text-muted-foreground">
                    {new Date(inv.issued_at).toLocaleDateString()}
                  </td>
                  <td className="py-2 pr-4">{formatCurrency(inv.gross_amount, inv.currency)}</td>
                  <td className="py-2 pr-4">{formatCurrency(inv.donation_amount, inv.currency)}</td>
                  <td className="py-2 pr-4">{formatCurrency(inv.platform_fee_amount, inv.currency)}</td>
                  <td className="py-2 pr-4">
                    <Badge variant={inv.status === "ISSUED" ? "default" : "secondary"}>{inv.status}</Badge>
                  </td>
                  <td className="py-2 pr-4 text-right">
                    <Button size="sm" variant="ghost" onClick={() => downloadInvoice(inv)}>
                      Download
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

