import { createFileRoute } from '@tanstack/react-router';
import { requireAdminBeforeLoad } from '@/lib/auth/requireAdmin';
import { useEffect, useState, useCallback } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { recomputePetriScores, seedDemoData, clearDemoData, getDemoSeedStatus } from '@/lib/gateway';
import { toast } from 'sonner';
import { AdminShell } from '@/components/admin/AdminShell';

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
      const result = await seed();
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
      const result = await clearSeed();
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
    <AdminShell
      eyebrow="Admin · Petri"
      title="🧠 Petri OS Control Center"
      description="Gateway OS: Active · Petri Mesh: Running"
    >
      <button
        onClick={handleRecompute}
        disabled={busy}
        className="w-full rounded-md border border-border bg-card px-4 py-2 text-sm text-foreground hover:bg-muted disabled: sm:w-auto"
      >
        {busy ? 'Recomputing…' : 'Recompute Petri Scores'}
      </button>
      {lastResult && (
        <p className="mt-3 text-xs text-muted-foreground sm:text-sm">
          Last run: scanned {lastResult.scanned} · written {lastResult.written} · skipped {lastResult.skipped} · {lastResult.duration_ms}ms
        </p>
      )}

      <div className="mt-10 border-t border-border/15 pt-6">
        <h2 className="text-lg font-semibold sm:text-xl">Demo Data Seeder</h2>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
          Populates sponsors, NGOs, campaigns, cases, Petri tokens/matches, donations, fulfillment events,
          and impact reports. All rows are tagged is_demo=true and can be cleared safely.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={handleSeed}
            disabled={seedBusy !== null}
            className="rounded-md border border-border bg-card px-4 py-2 text-sm text-foreground hover:bg-muted disabled:"
          >
            {seedBusy === 'seed' ? 'Seeding…' : 'Seed Demo Data'}
          </button>
          <button
            onClick={handleClear}
            disabled={seedBusy !== null}
            className="rounded-md border border-border bg-card px-4 py-2 text-sm text-foreground hover:bg-muted disabled:"
          >
            {seedBusy === 'clear' ? 'Clearing…' : 'Clear Demo Data'}
          </button>
          <button
            onClick={refreshCounts}
            disabled={seedBusy !== null}
            className="rounded-md border border-border bg-card px-4 py-2 text-sm text-foreground hover:bg-muted disabled:"
          >
            Refresh Status
          </button>
        </div>
        {counts && (
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3 sm:text-sm">
            {Object.entries(counts).map(([k, v]) => (
              <div key={k} className="surface-card rounded-2xl px-3 py-2">
                <div className="text-muted-foreground">{k}</div>
                <div className="font-semibold text-foreground">{v}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
