import { ROUTE_REGISTRY } from './routes.registry';

/**
 * ROUTE IMMUNITY LAYER
 * - NO throws
 * - NO side effects
 * - PURE validation only
 */

export function isValidRoute(path: string): boolean {
  return (
    ROUTE_REGISTRY.public.includes(path as any) ||
    ROUTE_REGISTRY.protected.includes(path as any) ||
    ROUTE_REGISTRY.admin.includes(path as any) ||
    ROUTE_REGISTRY.petri.includes(path as any)
  );
}

export function getRouteCategory(path: string): string {
  if (ROUTE_REGISTRY.public.includes(path as any)) return 'public';
  if (ROUTE_REGISTRY.protected.includes(path as any)) return 'protected';
  if (ROUTE_REGISTRY.admin.includes(path as any)) return 'admin';
  if (ROUTE_REGISTRY.petri.includes(path as any)) return 'petri';
  return 'unknown';
}

export function isAdminRoute(path: string): boolean {
  return ROUTE_REGISTRY.admin.includes(path as any);
}
