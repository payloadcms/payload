import type { AdminViewConfig, PayloadRequest, SanitizedConfig } from 'payload'

import { getRouteWithoutAdmin } from './shared.js'

/**
 * Returns an array of views marked with 'public: true' in the config
 */
export const isCustomAdminView = ({
  adminRoute,
  config,
  route,
}: {
  adminRoute: string
  config: SanitizedConfig
  route: string
}): boolean => {
  if (config.admin?.components?.views) {
    const isPublicAdminRoute = Object.entries(config.admin.components.views).some(([_, view]) => {
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
