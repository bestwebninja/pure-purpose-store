import { createFileRoute } from '@tanstack/react-router';
import { requireAdminBeforeLoad } from '@/lib/auth/requireAdmin';
import { useEffect, useState, useCallback } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { recomputePetriScores, seedDemoData, clearDemoData, getDemoSeedStatus } from '@/lib/gateway';
import { toast } from 'sonner';
import { AdminShell } from '@/components/admin/AdminShell';
import { Button } from '@/components/ui/button';

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
      <Button
        onClick={handleRecompute}
        disabled={busy}
        variant="blessing"
        className="w-full sm:w-auto"
      >
        {busy ? 'Recomputing…' : 'Recompute Petri Scores'}
      </Button>
      {lastResult && (
        <p className="mt-3 text-xs sm:text-sm text-primary-foreground/60">
          Last run: scanned {lastResult.scanned} · written {lastResult.written} · skipped {lastResult.skipped} · {lastResult.duration_ms}ms
        </p>
      )}

      <div className="mt-10 border-t border-primary-foreground/15 pt-6">
        <h2 className="text-lg sm:text-xl font-semibold">Demo Data Seeder</h2>
        <p className="mt-1 text-xs sm:text-sm text-primary-foreground/60">
          Populates sponsors, NGOs, campaigns, cases, Petri tokens/matches, donations, fulfillment events,
          and impact reports. All rows are tagged is_demo=true and can be cleared safely.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={handleSeed} disabled={seedBusy !== null} variant="outline" size="sm">
            {seedBusy === 'seed' ? 'Seeding…' : 'Seed Demo Data'}
          </Button>
          <Button onClick={handleClear} disabled={seedBusy !== null} variant="destructive" size="sm">
            {seedBusy === 'clear' ? 'Clearing…' : 'Clear Demo Data'}
          </Button>
          <Button onClick={refreshCounts} disabled={seedBusy !== null} variant="outline" size="sm">
            Refresh Status
          </Button>
        </div>
        {counts && (
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3 sm:text-sm">
            {Object.entries(counts).map(([k, v]) => (
              <div key={k} className="rounded-2xl border border-accent/30 bg-primary-foreground/5 px-3 py-2 shadow-[0_0_40px_-15px_rgba(56,189,248,0.4)] backdrop-blur-xl">
                <div className="text-primary-foreground/60">{k}</div>
                <div className="font-semibold">{v}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}