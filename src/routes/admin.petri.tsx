import { createFileRoute } from '@tanstack/react-router';
import { requireAdminBeforeLoad } from '@/lib/auth/requireAdmin';

export const Route = createFileRoute('/admin/petri')({
  beforeLoad: () => requireAdminBeforeLoad(),
  component: PetriAdminPage,
});

function PetriAdminPage() {
  return (
    <div style={{ padding: 24 }}>
      <h1>🧠 Petri OS Control Center</h1>

      <p>Gateway OS: Active</p>
      <p>Petri Mesh: Running</p>

      <button>Recompute Petri Scores</button>
    </div>
  );
}