type HealthState = "healthy" | "degraded" | "offline";

interface ModuleHealth {
  module: string;
  status: HealthState;
  updatedAt: number;
  failures: number;
}

const registry = new Map<string, ModuleHealth>();

export function markHealthy(module: string) {
  registry.set(module, {
    module,
    status: "healthy",
    updatedAt: Date.now(),
    failures: 0,
  });
}

export function markFailure(module: string) {
  const current = registry.get(module);

  registry.set(module, {
    module,
    status: "degraded",
    updatedAt: Date.now(),
    failures: (current?.failures ?? 0) + 1,
  });
}

export function getPetriHealth() {
  return Array.from(registry.values());
}
