export const ROUTE_REGISTRY = {
  public: [
    '/',
    '/login',
    '/reset-password',
  ],

  protected: [
    '/dashboard',
    '/me/profile',
    '/me/giving',
  ],

  admin: [
    '/admin',
    '/admin/petri-os',
    '/admin/ngo-dashboard',
    '/admin/command-center',
  ],

  petri: [
    '/admin/petri',
    '/admin/petri-os',
    '/admin/petri/contracts',
    '/admin/petri/mesh',
    '/admin/petri/reports',
  ],
} as const;

export type RouteKey =
  | 'public'
  | 'protected'
  | 'admin'
  | 'petri';
