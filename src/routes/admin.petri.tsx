import { createFileRoute } from '@tanstack/react-router';
import { requireAdminBeforeLoad } from '@/lib/auth/requireAdmin';

export const Route = createFileRoute('/admin/petri')({
  beforeLoad: () => requireAdminBeforeLoad(),
  component: PetriAdminPage,
});

function PetriAdminPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="text-2xl sm:text-3xl font-semibold break-words">🧠 Petri OS Control Center</h1>
      <p className="mt-2 text-sm sm:text-base">Gateway OS: Active</p>
      <p className="text-sm sm:text-base">Petri Mesh: Running</p>
      <button className="mt-4 w-full sm:w-auto rounded-md border px-4 py-2 text-sm">Recompute Petri Scores</button>
    </div>
  );
}