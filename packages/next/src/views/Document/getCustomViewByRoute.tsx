import type { EditViewComponent, SanitizedCollectionConfig, SanitizedGlobalConfig } from 'payload'

import { isPathMatchingRoute } from '../Root/isPathMatchingRoute.js'

export const getCustomViewByRoute = ({
  baseRoute,
  currentRoute,
  views,
}: {
  baseRoute: string
  currentRoute: string
  views:
    | SanitizedCollectionConfig['admin']['components']['views']
    | SanitizedGlobalConfig['admin']['components']['views']
}): {
  Component: EditViewComponent
  viewKey?: string
} => {
  if (typeof views?.edit === 'object') {
    let viewKey: string

    const foundViewConfig = Object.entries(views.edit).find(([key, view]) => {
      if (typeof view === 'object' && 'path' in view) {
        const viewPath = `${baseRoute}${view.path}`

        const isMatching = isPathMatchingRoute({
          currentRoute,
          exact: true,
          path: viewPath,
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
        Component: foundViewConfig.Component,
        viewKey,
      }
    }
  }

  return {
    Component: null,
  }
}
