import { ROUTE_REGISTRY } from "./routes.registry";

type RouteKey = keyof typeof ROUTE_REGISTRY;

export function isValidRoute(pathname: string): boolean {
  const allRoutes = Object.values(ROUTE_REGISTRY).flat();
  return allRoutes.includes(pathname as any);
}

export function getRouteAccessLevel(pathname: string): RouteKey | null {
  for (const [key, routes] of Object.entries(ROUTE_REGISTRY)) {
    if (routes.includes(pathname as any)) {
      return key as RouteKey;
    }
  }
  return null;
}

export function assertRouteAllowed(pathname: string, userRole: RouteKey = "public") {
  const routeLevel = getRouteAccessLevel(pathname);

  // ❌ Route does not exist in system
  if (!routeLevel) {
    throw new Error(`🚫 Route blocked (not registered): ${pathname}`);
  }

  // ❌ Role mismatch (hard firewall)
  const hierarchy: Record<string, number> = {
  public: 0,
  protected: 1,
  admin: 2,
  petri: 3,
};

  if (hierarchy[userRole] < hierarchy[routeLevel]) {
    throw new Error(`🚫 Access denied to route: ${pathname}`);
  }

  return true;
}