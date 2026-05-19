import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Inbox, Link2, HandCoins, Truck, BookOpen, Repeat } from "lucide-react";
import type { LifecycleCounts } from "@/server/lifecycle.server";
const STAGES: Array<{
  key: keyof LifecycleCounts;
  label: string;
  Icon: typeof Inbox;
}> = [{
  key: "requested",
  label: "Requested",
  Icon: Inbox
}, {
  key: "matched",
  label: "Matched",
  Icon: Link2
}, {
  key: "funded",
  label: "Funded",
  Icon: HandCoins
}, {
  key: "delivered",
  label: "Delivered",
  Icon: Truck
}, {
  key: "storyPublished",
  label: "Story Published",
  Icon: BookOpen
}, {
  key: "followupActive",
  label: "Followup Active",
  Icon: Repeat
}];
export function BlessingLifecycle({
  counts,
  compact = false
}: {
  counts: LifecycleCounts;
  compact?: boolean;
}) {
  return <Card className="p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Blessing Lifecycle</h2>
        <Badge variant="secondary">live</Badge>
      </div>
      <ol className={`grid gap-2 sm:gap-3 ${compact ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-6" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-6"}`}>
        {STAGES.map(({
        key,
        label,
        Icon
      }, i) => <li key={key} className="relative">
            <div className="rounded-lg border border-border/60 bg-card p-3 transition-shadow hover:shadow-card sm:p-4">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground sm:gap-2 sm:text-xs">
                <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="truncate">{i + 1}. {label}</span>
              </div>
              <div className="mt-1 text-xl font-semibold text-foreground sm:mt-2 sm:text-2xl">{counts[key]}</div>
            </div>
          </li>)}
      </ol>
    </Card>;
}
