import { createFileRoute } from "@tanstack/react-router";
import { VerificationDashboard } from "@/components/admin/VerificationDashboard";
import { requireAdminBeforeLoad } from "@/lib/auth/requireAdmin";

export const Route = createFileRoute("/admin/")({
  beforeLoad: () => requireAdminBeforeLoad(),
  component: AdminPage,
});

function AdminPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <VerificationDashboard />
    </div>
  );
}
