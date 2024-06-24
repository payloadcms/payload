import type { EditViewComponent } from 'payload/config'
import type { SanitizedCollectionConfig, SanitizedGlobalConfig } from 'payload/types'

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
}): EditViewComponent => {
  if (typeof views?.Edit === 'object' && typeof views?.Edit !== 'function') {
    const foundViewConfig = Object.entries(views.Edit).find(([, view]) => {
      if (typeof view === 'object' && typeof view !== 'function' && 'path' in view) {
        const viewPath = `${baseRoute}${view.path}`

        return isPathMatchingRoute({
          currentRoute,
          exact: true,
          path: viewPath,
        })
      }
      return false
    })?.[1]

    if (foundViewConfig && 'Component' in foundViewConfig) {
      return foundViewConfig.Component
    }
  }

  return null
}
