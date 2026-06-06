import { createFileRoute } from '@tanstack/react-router';
import { requireAdminBeforeLoad } from '@/lib/auth/requireAdmin';
import { useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { recomputePetriScores } from '@/lib/gateway';
import { toast } from 'sonner';

export const Route = createFileRoute('/admin/petri')({
  beforeLoad: () => requireAdminBeforeLoad(),
  component: PetriAdminPage,
});

function PetriAdminPage() {
  const recompute = useServerFn(recomputePetriScores);
  const [busy, setBusy] = useState(false);
  const [lastResult, setLastResult] = useState<null | { scanned: number; written: number; skipped: number; duration_ms: number }>(null);

  const handleRecompute = async () => {
    setBusy(true);
    try {
      const result = await recompute({ data: {} });
      setLastResult(result);
      toast.success(`Petri recompute complete — scanned ${result.scanned}, written ${result.written}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Petri recompute failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="text-2xl sm:text-3xl font-semibold break-words">🧠 Petri OS Control Center</h1>
      <p className="mt-2 text-sm sm:text-base">Gateway OS: Active</p>
      <p className="text-sm sm:text-base">Petri Mesh: Running</p>
      <button
        onClick={handleRecompute}
        disabled={busy}
        className="mt-4 w-full sm:w-auto rounded-md border px-4 py-2 text-sm disabled:opacity-60"
      >
        {busy ? 'Recomputing…' : 'Recompute Petri Scores'}
      </button>
      {lastResult && (
        <p className="mt-3 text-xs sm:text-sm text-muted-foreground">
          Last run: scanned {lastResult.scanned} · written {lastResult.written} · skipped {lastResult.skipped} · {lastResult.duration_ms}ms
        </p>
      )}
    </div>
  );
}