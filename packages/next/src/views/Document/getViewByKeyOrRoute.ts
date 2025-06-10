import type { SanitizedCollectionConfig, SanitizedGlobalConfig } from 'payload'

import type { ViewToRender } from './matchRouteToView.js'

import { UnauthorizedViewWithGutter } from '../Unauthorized/index.js'
import { defaultDocumentViews } from './defaults.js'
import { getViewByRoute } from './getViewByRoute.js'

/**
 * This function will find a view's component using either a key to the view's config object,
 * or by matching the current route against all paths in the `views` config.
 */
export const getViewByKeyOrRoute = ({
  basePath,
  condition,
  currentRoute,
  viewKey,
  views,
}: {
  basePath: Parameters<typeof getViewByRoute>[0]['basePath']
  condition?: () => boolean
  currentRoute: Parameters<typeof getViewByRoute>[0]['currentRoute']
  /**
   * The key that corresponds to the view in the `views` config.
   * If no view key was provided, will attempt to find the view's config by matching the current route against all paths.
   */
  viewKey?: string
  /**
   * The `admin.components.views` config object from the collection or global config.
   */
  views:
    | SanitizedCollectionConfig['admin']['components']['views']
    | SanitizedGlobalConfig['admin']['components']['views']
}): {
  View: ViewToRender
  viewKey?: string
} => {
  if (!viewKey) {
    return getViewByRoute({
      basePath,
      currentRoute,
      views,
    })
  }

  // If the user customized the view's path, don't mount the default view as it now exists at a different route
  // Note: the path could be '' (empty string)
  const hasCustomizedPath = views?.edit?.[viewKey] && 'path' in views.edit[viewKey]

  if (!hasCustomizedPath) {
    // Only run this check if the view is located on the config
    if (condition) {
      const shouldContinue = condition()

      if (shouldContinue === false) {
        return { View: UnauthorizedViewWithGutter }
      }
    }

    const CustomOrDefaultView =
      typeof views?.edit?.[viewKey] === 'object' && 'Component' in views.edit[viewKey]
        ? views?.edit?.[viewKey].Component
        : defaultDocumentViews[viewKey]

    return { View: CustomOrDefaultView, viewKey }
  } else {
    // Check for another view that may be occupying this path
    return getViewByRoute({
      basePath,
      currentRoute,
      views,
    })
  }
}
