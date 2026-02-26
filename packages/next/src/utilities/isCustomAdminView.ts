import type { SanitizedConfig } from 'payload'

import { getAdminConfig } from './adminConfigCache.js'
import { getRouteWithoutAdmin } from './getRouteWithoutAdmin.js'

export const isCustomAdminView = ({
  adminRoute,
  config,
  route,
}: {
  adminRoute: string
  config: SanitizedConfig
  route: string
}): boolean => {
  const adminConfig = getAdminConfig()
  const views = adminConfig.admin?.views ?? config.admin?.components?.views

  if (views) {
    const isPublicAdminRoute = Object.entries(views).some(([_, view]) => {
      const routeWithoutAdmin = getRouteWithoutAdmin({ adminRoute, route })

      if (view.exact) {
        if (routeWithoutAdmin === view.path) {
          return true
        }
      } else {
        if (routeWithoutAdmin.startsWith(view.path)) {
          return true
        }
      }
      return false
    })
    return isPublicAdminRoute
  }
  return false
}
