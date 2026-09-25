import type { SanitizedConfig } from 'payload'

import { getRouteWithoutAdmin } from './getRouteWithoutAdmin.js'

/** Returns true if the given route matches a custom admin view defined in the config. */
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
    return Object.entries(config.admin.components.views).some(([_, view]) => {
      const routeWithoutAdmin = getRouteWithoutAdmin({ adminRoute, route })

      if (view.exact) {
        return routeWithoutAdmin === view.path
      }

      return (
        view.path &&
        view.path !== '/' &&
        (routeWithoutAdmin === view.path || routeWithoutAdmin.startsWith(view.path + '/'))
      )
    })
  }
  return false
}
