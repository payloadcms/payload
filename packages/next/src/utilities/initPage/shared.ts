import type { SanitizedConfig } from 'payload'

const authRouteKeys: (keyof SanitizedConfig['admin']['routes'])[] = [
  'createFirstUser',
  'forgot',
  'login',
  'logout',
  'forgot',
  'inactivity',
  'unauthorized',
  'reset',
]

export const isAdminRoute = (route: string, adminRoute: string) => {
  return route.startsWith(adminRoute)
}

export const isAdminAuthRoute = (config: SanitizedConfig, route: string, adminRoute: string) => {
  const authRoutes = config.admin?.routes
    ? Object.entries(config.admin.routes)
        .filter(([key]) => authRouteKeys.includes(key as keyof SanitizedConfig['admin']['routes']))
        .map(([_, value]) => value)
    : []

  return authRoutes.some((r) => route.replace(adminRoute, '').startsWith(r))
}
