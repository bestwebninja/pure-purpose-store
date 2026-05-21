import { createFileRoute } from "@tanstack/react-router";
import { VerificationDashboard } from "@/components/admin/VerificationDashboard";

export const Route = createFileRoute("/admin/")({
  component: AdminPage,
});

function AdminPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <VerificationDashboard />
    </div>
  );
}
