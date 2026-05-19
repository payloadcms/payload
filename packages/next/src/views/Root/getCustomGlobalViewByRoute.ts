import type {
  AdminViewConfig,
  AdminViewServerProps,
  PayloadComponent,
  SanitizedGlobalConfig,
} from 'payload'

import type { ViewFromConfig } from './getRouteData.js'

import { isPathMatchingRoute } from './isPathMatchingRoute.js'

export const getCustomGlobalViewByRoute = ({
  adminRoute,
  baseRoute,
  currentRoute: currentRouteWithAdmin,
  views,
}: {
  adminRoute: string
  baseRoute: string
  currentRoute: string
  views: SanitizedGlobalConfig['admin']['components']['views']
}): {
  view: ViewFromConfig
  viewKey: null | string
} => {
  const currentRoute =
    adminRoute === '/'
      ? currentRouteWithAdmin
      : currentRouteWithAdmin.startsWith(adminRoute)
        ? currentRouteWithAdmin.slice(adminRoute.length)
        : currentRouteWithAdmin

  if (views && typeof views === 'object') {
    const foundEntry = Object.entries(views).find(([key, view]) => {
      if (key === 'edit') {
        return false
      }

      const isAdminViewConfig =
        typeof view === 'object' &&
        view !== null &&
        'path' in view &&
        'Component' in view &&
        typeof view.path === 'string'

      if (isAdminViewConfig) {
        const adminView = view as AdminViewConfig
        const viewPath = `${baseRoute}${adminView.path}`

        return isPathMatchingRoute({
          currentRoute,
          exact: adminView.exact,
          path: viewPath,
          sensitive: adminView.sensitive,
          strict: adminView.strict,
        })
      }

      return false
    })

    if (foundEntry) {
      const [viewKey, foundViewConfig] = foundEntry
      const adminView = foundViewConfig as AdminViewConfig
      return {
        view: {
          payloadComponent: adminView.Component as PayloadComponent<AdminViewServerProps>,
        },
        viewKey,
      }
    }
  }

  return {
    view: {
      Component: null,
    },
    viewKey: null,
  }
}
