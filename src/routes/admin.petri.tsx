import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/admin/petri')({
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