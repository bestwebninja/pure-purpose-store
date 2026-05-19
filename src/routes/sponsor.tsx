import { createFileRoute } from "@tanstack/react-router";
import { SponsorshipDashboard } from "@/components/sponsorship/SponsorshipDashboard";

export const Route = createFileRoute("/sponsor")({
  component: SponsorPage,
});

function SponsorPage() {
  return (
    <div className="min-h-screen w-full">
      <SponsorshipDashboard />
    </div>
  );
}
