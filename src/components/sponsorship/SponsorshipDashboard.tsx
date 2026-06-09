import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { checkZipFulfillment } from "@/lib/suppliers/zipFulfillment.functions";
import { verifyCheckoutFulfillment } from "@/lib/suppliers/checkoutVerification.functions";
import { allocateStabilization } from "@/lib/petri/petri.functions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FulfillmentState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; zip: string; active: boolean; supplier_count: number }
  | { status: "error"; message: string };

export function SponsorshipDashboard() {
  const checkZip = useServerFn(checkZipFulfillment);
  const verifyCheckout = useServerFn(verifyCheckoutFulfillment);
  const allocate = useServerFn(allocateStabilization);
  const [zip, setZip] = useState("");
  const [state, setState] = useState<FulfillmentState>({ status: "idle" });
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState<null | {
    fulfillable: boolean;
    supplierCount: number;
    zip: string;
  }>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [intentType, setIntentType] = useState<
    "veteran_stabilization" | "family_shelter" | "nutrition_only" | "general_stabilization"
  >("veteran_stabilization");
  const [matching, setMatching] = useState(false);
  const [match, setMatch] = useState<null | {
    fulfillable: boolean;
    allocation_score: number;
    matched_supplier_id: string | null;
    matched_blessee_id: string | null;
    reasoning: string[];
  }>(null);
  const [matchError, setMatchError] = useState<string | null>(null);

  useEffect(() => {
    const value = zip.trim();
    setVerified(null);
    setVerifyError(null);
    if (!value) {
      setState({ status: "idle" });
      return;
    }
    let cancelled = false;
    setState({ status: "loading" });
    const t = setTimeout(async () => {
      try {
        const res = await checkZip({ data: { zip: value } });
        if (cancelled) return;
        setState({
          status: "ready",
          zip: res.zip,
          active: res.active,
          supplier_count: res.supplier_count,
        });
      } catch (err) {
        if (cancelled) return;
        setState({
          status: "error",
          message: err instanceof Error ? err.message : "Lookup failed",
        });
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [zip, checkZip]);

  const fulfillable = state.status === "ready" && state.active;

  async function handleSponsor() {
    const value = zip.trim();
    if (!value) return;
    setVerifying(true);
    setVerifyError(null);
    setMatch(null);
    setMatchError(null);
    try {
      const res: any = await verifyCheckout({ data: { zip: value } });
      setVerified(res);
      if (!res.fulfillable) {
        setVerifyError("Sponsorship not yet active in this region");
        return;
      }
      setMatching(true);
      const allocation = await allocate({
        data: {
          zip: value,
          intent: {
            sponsor_id: "self",
            intent_type: intentType,
            preferred_region: value,
            funding_capacity: 500,
          },
        },
      });
      setMatch(allocation);
      if (!allocation.fulfillable) {
        setMatchError("No stabilization match available right now");
      }
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setVerifying(false);
      setMatching(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[30%_70%] gap-4 p-4">
      <aside className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Service area</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="sponsor-zip">ZIP / Postal code</Label>
            <Input
              id="sponsor-zip"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              placeholder="e.g. 10115"
              maxLength={16}
            />
            {state.status === "loading" && (
              <p className="text-sm text-muted-foreground text-black">Checking coverage…</p>
            )}
            {state.status === "ready" && state.active && (
              <p className="text-sm text-success">
                Active — {state.supplier_count} supplier
                {state.supplier_count === 1 ? "" : "s"} available
              </p>
            )}
            {state.status === "ready" && !state.active && (
              <p className="text-sm text-destructive">
                Sponsorship not yet active in this region
              </p>
            )}
            {state.status === "error" && (
              <p className="text-sm text-destructive">{state.message}</p>
            )}
          </CardContent>
        </Card>
      </aside>

      <section className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Sponsorship package — $500</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-black">
              Accommodation, meals and reintegration support routed to verified
              local suppliers in the sponsored ZIP.
            </p>

            <div className="space-y-2">
              <Label htmlFor="sponsor-intent">Sponsor intent</Label>
              <Select
                value={intentType}
                onValueChange={(v) => setIntentType(v as typeof intentType)}
              >
                <SelectTrigger id="sponsor-intent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="veteran_stabilization">Veteran stabilization</SelectItem>
                  <SelectItem value="family_shelter">Family shelter</SelectItem>
                  <SelectItem value="nutrition_only">Nutrition only</SelectItem>
                  <SelectItem value="general_stabilization">General stabilization</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {state.status === "ready" && !state.active && (
              <p className="text-sm text-destructive">
                Sponsorship not yet active in this region
              </p>
            )}

            <Button
              type="button"
              disabled={!fulfillable || verifying || matching}
              className="w-full"
              onClick={handleSponsor}
            >
              {verifying
                ? "Verifying real-world availability…"
                : matching
                ? "Matching stabilization recipient…"
                : fulfillable
                ? "Sponsor this package"
                : "Enter a serviceable ZIP to continue"}
            </Button>

            {verifyError && (
              <p className="text-sm text-destructive">{verifyError}</p>
            )}
            {verified?.fulfillable && (
              <p className="text-sm text-success">
                Verified — {verified.supplierCount} active supplier
                {verified.supplierCount === 1 ? "" : "s"} ready for fulfillment.
              </p>
            )}
            {matchError && (
              <p className="text-sm text-destructive">{matchError}</p>
            )}
            {match?.fulfillable && (
              <div className="rounded-md border border-border bg-muted/30 p-3 text-sm space-y-1">
                <p className="font-medium">
                  Allocation score: {match.allocation_score}
                </p>
                <p className="text-muted-foreground">
                  Blessee: <span className="font-mono">{match.matched_blessee_id}</span>
                </p>
                <p className="text-muted-foreground">
                  Supplier: <span className="font-mono">{match.matched_supplier_id}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {match.reasoning.join(" · ")}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
