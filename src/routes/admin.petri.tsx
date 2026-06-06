import { createFileRoute } from '@tanstack/react-router';
import { requireAdminBeforeLoad } from '@/lib/auth/requireAdmin';
import { useEffect, useState, useCallback } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { recomputePetriScores, seedDemoData, clearDemoData, getDemoSeedStatus } from '@/lib/gateway';
import { toast } from 'sonner';

export const Route = createFileRoute('/admin/petri')({
  beforeLoad: () => requireAdminBeforeLoad(),
  component: PetriAdminPage,
});

function PetriAdminPage() {
  const recompute = useServerFn(recomputePetriScores);
  const seed = useServerFn(seedDemoData);
  const clearSeed = useServerFn(clearDemoData);
  const fetchStatus = useServerFn(getDemoSeedStatus);
  const [busy, setBusy] = useState(false);
  const [seedBusy, setSeedBusy] = useState<null | 'seed' | 'clear' | 'status'>(null);
  const [counts, setCounts] = useState<Record<string, number> | null>(null);
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

  const refreshCounts = useCallback(async () => {
    try {
      const { counts } = await fetchStatus();
      setCounts(counts);
    } catch (e) {
      // silent — status panel is auxiliary
      console.warn('demo status', e);
    }
  }, [fetchStatus]);

  useEffect(() => { refreshCounts(); }, [refreshCounts]);

  const handleSeed = async () => {
    setSeedBusy('seed');
    try {
      const result = await seed({ data: {} });
      toast.success(`Demo data seeded in ${result.duration_ms}ms`);
      await refreshCounts();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Demo seed failed');
    } finally {
      setSeedBusy(null);
    }
  };

  const handleClear = async () => {
    setSeedBusy('clear');
    try {
      const result = await clearSeed({ data: {} });
      const total = Object.values(result.deleted).reduce((a, b) => a + b, 0);
      toast.success(`Cleared ${total} demo rows`);
      await refreshCounts();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Demo clear failed');
    } finally {
      setSeedBusy(null);
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

      <div className="mt-10 border-t pt-6">
        <h2 className="text-lg sm:text-xl font-semibold">Demo Data Seeder</h2>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
          Populates sponsors, NGOs, campaigns, cases, Petri tokens/matches, donations, fulfillment events,
          and impact reports. All rows are tagged is_demo=true and can be cleared safely.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={handleSeed}
            disabled={seedBusy !== null}
            className="rounded-md border px-4 py-2 text-sm disabled:opacity-60"
          >
            {seedBusy === 'seed' ? 'Seeding…' : 'Seed Demo Data'}
          </button>
          <button
            onClick={handleClear}
            disabled={seedBusy !== null}
            className="rounded-md border px-4 py-2 text-sm disabled:opacity-60"
          >
            {seedBusy === 'clear' ? 'Clearing…' : 'Clear Demo Data'}
          </button>
          <button
            onClick={refreshCounts}
            disabled={seedBusy !== null}
            className="rounded-md border px-4 py-2 text-sm disabled:opacity-60"
          >
            Refresh Status
          </button>
        </div>
        {counts && (
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3 sm:text-sm">
            {Object.entries(counts).map(([k, v]) => (
              <div key={k} className="rounded border px-3 py-2">
                <div className="text-muted-foreground">{k}</div>
                <div className="font-semibold">{v}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}