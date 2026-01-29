import type { SanitizedCollectionConfig } from 'payload'

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

      if (typeof view === 'object' && 'path' in view) {
        const viewPath = `${baseRoute}${view.path}`

        const isMatching = isPathMatchingRoute({
          currentRoute,
          exact: view.exact,
          path: viewPath,
          sensitive: view.sensitive,
          strict: view.strict,
        })

        if (isMatching) {
          viewKey = key
        }

        return isMatching
      }

      return false
    })?.[1]

    if (foundViewConfig && 'Component' in foundViewConfig) {
      return {
        view: {
          payloadComponent: foundViewConfig.Component,
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
