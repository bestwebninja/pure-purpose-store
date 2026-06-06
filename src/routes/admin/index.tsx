import { createFileRoute } from "@tanstack/react-router";
import { VerificationDashboard } from "@/components/admin/VerificationDashboard";
import { requireAdminBeforeLoad } from "@/lib/auth/requireAdmin";
import { AdminShell } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/admin/")({
  beforeLoad: () => requireAdminBeforeLoad(),
  component: AdminPage,
});

function AdminPage() {
  return (
    <AdminShell eyebrow="Admin" title="Verification Hub" description="Review and verify pending sponsor and NGO applications.">
      <VerificationDashboard />
    </AdminShell>
  );
}
