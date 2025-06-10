import type { EditViewComponent, SanitizedCollectionConfig, SanitizedGlobalConfig } from 'payload'

import { isPathMatchingRoute } from '../Root/isPathMatchingRoute.js'
import { defaultDocumentViews } from './defaults.js'

/**
 * This function will find a view's component based on the current route.
 * Does so by iterating through the all views in the config and checking if the route matches any of the view paths.
 * Use it sparingly, as it can be expensive to iterate through all views and match paths.
 */
export const getViewByRoute = ({
  basePath,
  currentRoute,
  views,
}: {
  /**
   * The path leading up to the view's path.
   * For example, if the view's path is `/edit`, it will become `/api/collections/:collection/:id/edit`.
   * The base path here is `/api/collections/:collection/:id`.
   */
  basePath: string
  /**
   * The current route being accessed.
   * For example, `/api/collections/posts/123/edit`.
   */
  currentRoute: string
  /**
   * The `admin.components.views` config object from the collection or global config.
   */
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
        const viewPath = `${basePath}${view.path}`

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
    } else {
      // Need to run conditions here as well?!?!?!
      return {
        Component: defaultDocumentViews[viewKey]?.Component || null,
        viewKey,
      }
    }
  }

  return {
    Component: null,
  }
}
