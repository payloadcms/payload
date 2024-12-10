import type { SanitizedConfig } from 'payload'

// Routes that require admin authentication
const publicAdminRoutes: (keyof Pick<
  SanitizedConfig['admin']['routes'],
  'createFirstUser' | 'forgot' | 'inactivity' | 'login' | 'logout' | 'reset' | 'unauthorized'
>)[] = [
  'createFirstUser',
  'forgot',
  'login',
  'logout',
  'forgot',
  'inactivity',
  'unauthorized',
  'reset',
]

export const isAdminRoute = ({
  adminRoute,
  route,
}: {
  adminRoute: string
  config: SanitizedConfig
  route: string
}): boolean => {
  return route.startsWith(adminRoute)
}

export const isPublicAdminRoute = ({
  adminRoute,
  config,
  route,
}: {
  adminRoute: string
  config: SanitizedConfig
  route: string
}): boolean => {
  const isPublicAdminRoute = publicAdminRoutes.some((routeSegment) => {
    const segment = config.admin?.routes?.[routeSegment] || routeSegment
    const routeWithoutAdmin = getRouteWithoutAdmin({ adminRoute, route })

    if (routeWithoutAdmin.startsWith(segment)) {
      return true
    } else if (routeWithoutAdmin.includes('/verify/')) {
      return true
    } else {
      return false
    }
  })

  return isPublicAdminRoute
}

export const getRouteWithoutAdmin = ({
  adminRoute,
  route,
}: {
  adminRoute: string
  route: string
}): string => {
  return adminRoute && adminRoute !== '/' ? route.replace(adminRoute, '') : route
}
