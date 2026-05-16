import { Link } from "@tanstack/react-router";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Users, MapPin } from "lucide-react";
import type { Campaign } from "@/server/campaigns.functions";

type CardCampaign = Pick<
  Campaign,
  "handle" | "title" | "image_url" | "short_description" | "location" | "donor_count" | "goal_amount" | "raised_amount" | "currency"
>;

function formatMoney(n: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
}

export function CampaignCard({ campaign }: { campaign: CardCampaign }) {
  const pct = Math.min(100, campaign.goal_amount > 0 ? Math.round((campaign.raised_amount / campaign.goal_amount) * 100) : 0);
  return (
    <Link to="/campaign/$handle" params={{ handle: campaign.handle }} className="group">
      <Card className="overflow-hidden border-border/60 bg-card transition-shadow hover:shadow-card">
        <div className="aspect-[4/3] overflow-hidden bg-muted">
          {campaign.image_url ? (
            <img
              src={campaign.image_url}
              alt={campaign.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full bg-gradient-warm" />
          )}
        </div>
        <div className="space-y-4 p-5">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {campaign.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {campaign.location}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Users className="h-3 w-3" /> {campaign.donor_count} blessings
            </span>
          </div>
          <h3 className="text-display line-clamp-2 text-xl font-semibold leading-snug">{campaign.title}</h3>
          {campaign.short_description && (
            <p className="line-clamp-2 text-sm text-muted-foreground">{campaign.short_description}</p>
          )}
          <div className="space-y-2">
            <Progress value={pct} className="h-2" />
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-semibold text-foreground">
                {formatMoney(Number(campaign.raised_amount), campaign.currency)}
              </span>
              <span className="text-muted-foreground">
                of {formatMoney(Number(campaign.goal_amount), campaign.currency)}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

