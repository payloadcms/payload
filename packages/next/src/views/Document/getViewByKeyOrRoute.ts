import type { SanitizedCollectionConfig, SanitizedConfig, SanitizedGlobalConfig } from 'payload'

import { UnauthorizedError } from 'payload'

import type { ViewToRender } from './getDocumentView.js'

import { NotFoundView } from '../NotFound/index.js'
import { UnauthorizedViewWithGutter } from '../Unauthorized/index.js'
import { defaultDocumentViews } from './defaults.js'
import { matchRouteToView } from './matchRouteToView.js'

/**
 * This function will find a view's component using either a key to the view's config object,
 * or by matching the current route against all paths in the `views` config.
 */
export const getViewByKeyOrRoute = ({
  basePath,
  collectionConfig,
  config,
  currentRoute,
  globalConfig,
  viewKey,
}: {
  basePath: Parameters<typeof matchRouteToView>[0]['basePath']
  collectionConfig?: SanitizedCollectionConfig
  config: SanitizedConfig
  currentRoute: Parameters<typeof matchRouteToView>[0]['currentRoute']
  globalConfig?: SanitizedGlobalConfig
  /**
   * The key that corresponds to the view in the `views` config.
   * If no view key was provided, will attempt to find the view's config by matching the current route against all paths.
   */
  viewKey?: string
}): {
  Component: ViewToRender
  viewKey?: string
} => {
  const views =
    (collectionConfig && collectionConfig?.admin?.components?.views) ||
    (globalConfig && globalConfig?.admin?.components?.views)

  if (!viewKey) {
    return matchRouteToView({
      basePath,
      currentRoute,
      views,
    })
  }

  // If the user customized the view's path, don't mount the default view as it now exists at a different route
  // Note: the path could be '' (empty string)
  const hasCustomizedPath = views?.edit?.[viewKey] && 'path' in views.edit[viewKey]

  if (!hasCustomizedPath) {
    const viewConfig = {
      ...(defaultDocumentViews?.[viewKey] || {}),
      ...(views?.edit?.[viewKey] || {}),
    }

    /**
     * Runs conditions returning the found view. For example, to conditionally render the API view based on `hideAPIURL`.
     * Should not run if another view is mounted to this route. For example, you wouldn't want `hideAPIURL` to apply to `myCustomView`.
     * If not explicitly false, will return the `NotFoundView`. You can also throw an `UnauthorizedError` to render the `Unauthorized` view.
     */
    if (typeof viewConfig.condition === 'function') {
      try {
        const meetsCondition = viewConfig.condition({
          collectionConfig,
          config,
          // docPermissions,
          globalConfig,
          viewKey,
        })

        if (meetsCondition === false) {
          return { Component: NotFoundView }
        }
      } catch (error) {
        if (error instanceof UnauthorizedError) {
          return { Component: UnauthorizedViewWithGutter }
        }
      }
    }

    return { Component: viewConfig.Component, viewKey }
  } else {
    // Check for another view that may be occupying this path
    return matchRouteToView({
      basePath,
      currentRoute,
      views,
    })
  }
}
