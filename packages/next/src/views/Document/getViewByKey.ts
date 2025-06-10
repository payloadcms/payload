import type { SanitizedCollectionConfig, SanitizedGlobalConfig } from 'payload'

import type { ViewToRender } from './matchRouteToView.js'

import { UnauthorizedViewWithGutter } from '../Unauthorized/index.js'
import { defaultDocumentViews } from './defaults.js'
import { getCustomViewByRoute } from './getCustomViewByRoute.js'

/**
 * Determine which view to render based on the provided key.
 * Looks up the view's config using the provided key.
 * If the `Component` property is defined, it will be used as the view.
 */
export const getViewByKeyOrRoute = ({
  baseRoute,
  condition,
  currentRoute,
  viewKey,
  views,
}: {
  baseRoute?: string
  condition?: () => boolean
  currentRoute?: string
  viewKey: string
  views:
    | SanitizedCollectionConfig['admin']['components']['views']
    | SanitizedGlobalConfig['admin']['components']['views']
}): ViewToRender => {
  // If the user customized the view's path, don't mount the default view as it now exists at a different route
  // Note: the path could be '' (empty string)
  const hasCustomizedPath = views?.edit?.[viewKey] && 'path' in views.edit[viewKey]

  if (!hasCustomizedPath) {
    // Only run this check if the view is located on the config
    if (condition) {
      const shouldContinue = condition()

      if (shouldContinue === false) {
        return UnauthorizedViewWithGutter
      }
    }

    return typeof views?.edit?.[viewKey] === 'object' && 'Component' in views.edit[viewKey]
      ? views?.edit?.[viewKey].Component
      : defaultDocumentViews[viewKey]
  } else {
    // look for another view that may be occupying this path
    return getCustomViewByRoute({
      baseRoute,
      currentRoute,
      views,
    }).View
  }
}
