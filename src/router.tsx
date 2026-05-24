import { emitTelemetry } from "./lib/telemetry/gateway.telemetry";
import { getUserRole } from "./lib/auth/route.auth";
import { assertRouteAllowed, isValidRoute } from "./lib/route.guard";
import { createRouter, useRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { assertRouteAllowed, isValidRoute } from "./lib/route.guard";

/**
 * ==============================
 * ROUTE IMMUNITY FIREWALL LAYER
 * ==============================
 * Enforces:
 * - registered routes only
 * - role-based access (future)
 * - runtime route validation
 */

// ---------------- ERROR UI ----------------

function DefaultErrorComponent({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">

        <h1 className="text-2xl font-bold">Something went wrong</h1>

        <p className="mt-2 text-sm text-muted-foreground">
          An unexpected error occurred.
        </p>

        {import.meta.env.DEV && error?.message && (
          <pre className="mt-4 overflow-auto bg-muted p-3 text-xs text-red-500">
            {error.message}
          </pre>
        )}

        <div className="mt-6 flex gap-3 justify-center">

          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded bg-primary px-4 py-2 text-white"
          >
            Try again
          </button>

          <a
            href="/"
            className="rounded border px-4 py-2"
          >
            Go home
          </a>

        </div>
      </div>
    </div>
  );
}

// ---------------- ROUTER FACTORY ----------------

export const getRouter = () => {
  const router = createRouter({
    routeTree,
    context: {},
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultErrorComponent,

    /**
     * ==============================
     * ROUTE IMMUNITY FIREWALL
     * ==============================
     */
  beforeLoad: async ({ location }) => {
  const path = location.pathname;

  // 1. INVALID ROUTE
  if (!isValidRoute(path)) {
    emitTelemetry({
      type: "ROUTE_INVALID",
      path,
      message: "Route not registered in RouteRegistry",
    });

    throw new Error(`Route not registered: ${path}`);
  }

  // 2. AUTH RESOLUTION
  const role = await getUserRole();

  emitTelemetry({
    type: "AUTH_RESOLVED",
    path,
    role,
  });

  // 3. FIREWALL CHECK
  try {
    assertRouteAllowed(path, role);

    emitTelemetry({
      type: "ROUTE_ALLOW",
      path,
      role,
    });
  } catch (err: any) {
    emitTelemetry({
      type: "ROUTE_BLOCK",
      path,
      role,
      message: err?.message ?? "Access denied",
    });

    throw err;
  }
},

  // 1. Route registry check (hard gate)
  if (!isValidRoute(path)) {
    console.warn("🚫 Invalid route blocked:", path);
    throw new Error(`Route not registered: ${path}`);
  }

  // 2. Resolve real user identity
  const role = await getUserRole();

  // 3. Enforce access policy
  try {
    assertRouteAllowed(path, role);
  } catch (err) {
    console.error("🚫 Route firewall denied:", err);
    throw err;
  }
},
      // 2. Role enforcement (placeholder → upgrade later with Supabase)
      try {
        assertRouteAllowed(path, "admin");
      } catch (err) {
        console.error("🚫 Route access denied:", err);
        throw err;
      }
    },
  });

  return router;
};