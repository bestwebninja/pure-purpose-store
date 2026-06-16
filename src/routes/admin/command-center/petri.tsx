import { createFileRoute } from "@tanstack/react-router";
import { requireAdminBeforeLoad } from "@/lib/auth/requireAdmin";
import { AdminShell } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/admin/command-center/petri")({
  beforeLoad: () => requireAdminBeforeLoad(),
  component: PetriDashboard,
});

function PetriDashboard() {
  return (
    <AdminShell eyebrow="Admin · Petri" title="?? Petri OS Control Center">
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">System Health</h2>
          <p className="mt-1 text-sm text-primary-foreground/70">Gateway OS: Active</p>
          <p className="text-sm text-primary-foreground/70">Petri Mesh: Running</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Core Modules</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-primary-foreground/80">
          <li>NGO Lifecycle Engine</li>
          <li>Sponsor Allocation Engine</li>
          <li>Petri Scoring System</li>
          <li>Impact Telemetry Layer</li>
        </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Admin Controls</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            <button className="rounded-md border border-accent/40 bg-primary-foreground/5 px-4 py-2 text-sm text-primary-foreground hover:bg-primary-foreground/10">Recompute Petri Scores</button>
            <button className="rounded-md border border-accent/40 bg-primary-foreground/5 px-4 py-2 text-sm text-primary-foreground hover:bg-primary-foreground/10">Run System Audit</button>
            <button className="rounded-md border border-accent/40 bg-primary-foreground/5 px-4 py-2 text-sm text-primary-foreground hover:bg-primary-foreground/10">Sync Sponsor Network</button>
          </div>
        </div>
      </section>
    </AdminShell>
  );
}
