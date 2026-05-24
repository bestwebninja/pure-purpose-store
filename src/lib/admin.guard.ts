import { isAdminRoute } from './route.guard';

export function assertAdminAccess(path: string, isAdmin: boolean) {
  if (isAdminRoute(path) && !isAdmin) {
    throw new Error('ADMIN_ACCESS_DENIED');
  }
}
