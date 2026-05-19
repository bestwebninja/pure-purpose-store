import { createFileRoute } from "@tanstack/react-router";
import { SponsorshipDashboard } from "@/components/sponsorship/SponsorshipDashboard";

export const Route = createFileRoute("/give")({
  component: GivePage,
});

function GivePage() {
  return (
    <div className="min-h-screen w-full">
      <SponsorshipDashboard />
    </div>
  );
}
