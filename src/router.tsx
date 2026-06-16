import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

/**
 * ROUTER CORE — PURE UI LAYER
 *
 * RULES:
 * - NO server imports here
 * - NO gateway registration here
 * - NO telemetry / auth logic
 * - ONLY routing bootstrap
 */

/**
 * Global error boundary for route failures
 */
function DefaultErrorComponent({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h2>Something went wrong</h2>

      <pre className="text-destructive" style={{ whiteSpace: "pre-wrap" }}>
        {error?.message ?? "Unknown error"}
      </pre>

      <button
        onClick={reset}
        style={{
          marginTop: 12,
          padding: "8px 12px",
          cursor: "pointer",
        }}
      >
        Retry
      </button>
    </div>
  );
}

/**
 * Router Factory
 * CLEAN CLIENT BOOTSTRAP ONLY
 */
export const getRouter = () => {
  return createRouter({
    routeTree,
    context: {},
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: DefaultErrorComponent,
  });
};
