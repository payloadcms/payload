import type {
  DocumentViewCondition,
  EditConfigWithoutRoot,
  SanitizedCollectionConfig,
  SanitizedCollectionPermission,
  SanitizedConfig,
  SanitizedGlobalConfig,
  SanitizedGlobalPermission,
} from 'payload'

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
  docPermissions,
  globalConfig,
  routeSegments,
  viewKey,
}: {
  basePath: Parameters<typeof matchRouteToView>[0]['basePath']
  collectionConfig?: SanitizedCollectionConfig
  config: SanitizedConfig
  currentRoute: Parameters<typeof matchRouteToView>[0]['currentRoute']
  docPermissions: SanitizedCollectionPermission | SanitizedGlobalPermission
  globalConfig?: SanitizedGlobalConfig
  routeSegments: string[]
  /**
   * The key that corresponds to the view in the `views` config.
   * If no view key was provided, will attempt to find the view's config by matching the current route against all paths.
   */
  viewKey?: keyof EditConfigWithoutRoot
}): {
  Component: ViewToRender
  viewKey?: string
} => {
  const views =
    (collectionConfig && collectionConfig?.admin?.components?.views) ||
    (globalConfig && globalConfig?.admin?.components?.views)

  /**
   * Runs conditions that should return the not found view. E.g., conditionally render the API view based on `hideAPIURL`.
   * Should not run if another view is mounted to this route. E.g., you wouldn't want `hideAPIURL` to apply to `myCustomView` mounted to "/api".
   * If not explicitly false, will return the `NotFoundView`. You can also throw an `UnauthorizedError` to render the `Unauthorized` view.
   */
  const runCondition = (condition: DocumentViewCondition) => {
    try {
      const meetsCondition = condition({
        collectionConfig,
        config,
        docPermissions,
        globalConfig,
        routeSegments,
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

  if (!viewKey) {
    const matchedView = matchRouteToView({
      basePath,
      currentRoute,
      views,
    })

    if (typeof matchedView.condition === 'function') {
      const conditionResult = runCondition(matchedView.condition)

      if (conditionResult) {
        return conditionResult
      }
    }

    return matchedView
  }

  // If the user customized the view's path, don't mount the default view as it now exists at a different route
  // Note: the path could be '' (empty string)
  const hasCustomizedPath = views?.edit?.[viewKey] && 'path' in views.edit[viewKey]

  if (hasCustomizedPath) {
    // Check for another view that may be occupying this path
    const matchedView = matchRouteToView({
      basePath,
      currentRoute,
      views,
    })

    if (typeof matchedView.condition === 'function') {
      const conditionResult = runCondition(matchedView.condition)

      if (conditionResult) {
        return conditionResult
      }
    }

    return matchedView
  }

  const viewConfig = {
    ...(defaultDocumentViews?.[viewKey] || {}),
    ...(views?.edit?.[viewKey] || {}),
  }

  if (typeof viewConfig.condition === 'function') {
    const conditionResult = runCondition(viewConfig.condition)

    if (conditionResult) {
      return conditionResult
    }
  }

  return { Component: viewConfig.Component, viewKey: viewKey as string }
}
