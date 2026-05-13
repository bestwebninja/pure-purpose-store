import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Inbox, Link2, HandCoins, Truck, BookOpen, Repeat } from "lucide-react";
import type { LifecycleCounts } from "@/lib/dashboard.functions";

const STAGES: Array<{ key: keyof LifecycleCounts; label: string; Icon: typeof Inbox }> = [
  { key: "requested", label: "Requested", Icon: Inbox },
  { key: "matched", label: "Matched", Icon: Link2 },
  { key: "funded", label: "Funded", Icon: HandCoins },
  { key: "delivered", label: "Delivered", Icon: Truck },
  { key: "storyPublished", label: "Story Published", Icon: BookOpen },
  { key: "followupActive", label: "Followup Active", Icon: Repeat },
];

export function BlessingLifecycle({ counts, compact = false }: { counts: LifecycleCounts; compact?: boolean }) {
  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Blessing Lifecycle</h2>
        <Badge variant="secondary">live</Badge>
      </div>
      <ol className={`grid gap-3 ${compact ? "grid-cols-3 md:grid-cols-6" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-6"}`}>
        {STAGES.map(({ key, label, Icon }, i) => (
          <li key={key} className="relative">
            <div className="rounded-lg border border-border/60 bg-card p-4 transition-shadow hover:shadow-card">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                <Icon className="h-4 w-4" />
                <span>{i + 1}. {label}</span>
              </div>
              <div className="mt-2 text-2xl font-semibold text-foreground">{counts[key]}</div>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}