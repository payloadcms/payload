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
  const publicViews = getPublicViews({ config })

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

  // Check if any custom views should be public
  const isPublicView = publicViews.some((view) => {
    const routeWithoutAdmin = getRouteWithoutAdmin({ adminRoute, route })

    if (view.exact) {
      return routeWithoutAdmin === view.path
    } else {
      return routeWithoutAdmin.startsWith(view.path)
    }
  })

  return isPublicAdminRoute || isPublicView
}

/**
 * Returns an array of views marked with 'public: true' in the config
 */
export const getPublicViews = ({
  config,
}: {
  config: SanitizedConfig
}): { exact: boolean; path: string }[] => {
  const publicViews = []

  if (config.admin?.components?.views) {
    Object.entries(config.admin.components.views).forEach(([_, view]) => {
      if (view.public) {
        publicViews.push({ exact: view.exact || false, path: view.path })
      }
    })
  }

  return publicViews
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
