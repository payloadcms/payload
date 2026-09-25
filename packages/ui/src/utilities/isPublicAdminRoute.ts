import type { SanitizedConfig } from 'payload'

import { getRouteWithoutAdmin } from './getRouteWithoutAdmin.js'

// Routes that are accessible without admin authentication
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

export const isPublicAdminRoute = ({
  adminRoute,
  config,
  route,
}: {
  adminRoute: string
  config: SanitizedConfig
  route: string
}): boolean => {
  const routeWithoutAdmin = getRouteWithoutAdmin({ adminRoute, route })
  const routeSegments = routeWithoutAdmin.split('/').filter(Boolean)
  const isVerifyRoute =
    routeSegments.length === 3 &&
    routeSegments[1] === 'verify' &&
    config.collections.some(
      (collection) => collection.slug === routeSegments[0] && Boolean(collection.auth),
    )

  if (isVerifyRoute) {
    return true
  }

  return publicAdminRoutes.some((routeSegment) => {
    const segment = config.admin?.routes?.[routeSegment] || routeSegment

    if (routeWithoutAdmin.startsWith(segment)) {
      return true
    } else {
      return false
    }
  })
}
