import type { AdminViewConfig, AdminViewServerProps, PayloadComponent, SanitizedCollectionConfig  } from 'payload'

import type { ViewFromConfig } from './getRouteData.js'

import { isPathMatchingRoute } from './isPathMatchingRoute.js'

export const getCustomCollectionViewByRoute = ({
  baseRoute,
  currentRoute,
  views,
}: {
  baseRoute: string
  currentRoute: string
  views: SanitizedCollectionConfig['admin']['components']['views']
}): {
  view: ViewFromConfig
  viewKey?: string
} => {
  if (typeof views === 'object') {
    let viewKey: string

    const foundViewConfig = Object.entries(views).find(([key, view]) => {
      // Skip the known collection view types: edit and list
      if (key === 'edit' || key === 'list') {
        return false
      }

      // Type guard: custom views should be AdminViewConfig with path and Component
      const isAdminViewConfig =
        typeof view === 'object' &&
        view !== null &&
        'path' in view &&
        'Component' in view &&
        typeof view.path === 'string'

      if (isAdminViewConfig) {
        const adminView = view as AdminViewConfig
        const viewPath = `${baseRoute}${adminView.path}`

        const isMatching = isPathMatchingRoute({
          currentRoute,
          exact: adminView.exact,
          path: viewPath,
          sensitive: adminView.sensitive,
          strict: adminView.strict,
        })

        if (isMatching) {
          viewKey = key
        }

        return isMatching
      }

      return false
    })?.[1]

    if (foundViewConfig && 'Component' in foundViewConfig) {
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
