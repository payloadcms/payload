import type {
  AdminViewServerProps,
  PayloadComponent,
  SanitizedCollectionConfig,
  SanitizedCollectionPermission,
  SanitizedConfig,
  SanitizedGlobalConfig,
  SanitizedGlobalPermission,
} from 'payload'
import type React from 'react'

import type { ViewMap } from './createViewMap.js'

import { isPathMatchingRoute } from '../Root/isPathMatchingRoute.js'
import { createViewMap } from './createViewMap.js'

export type ViewFromConfig<TProps extends object> = {
  Component?: React.FC<TProps>
  ComponentConfig?: PayloadComponent<TProps>
}

export const getViewsFromConfig = ({
  collectionConfig,
  config,
  docPermissions,
  globalConfig,
  overrideDocPermissions,
  routeSegments,
}: {
  collectionConfig?: SanitizedCollectionConfig
  config: SanitizedConfig
  globalConfig?: SanitizedGlobalConfig
  routeSegments: string[]
} & (
  | {
      docPermissions: SanitizedCollectionPermission | SanitizedGlobalPermission
      overrideDocPermissions?: false | undefined
    }
  | {
      docPermissions?: never
      overrideDocPermissions: true
    }
)): {
  /**
   * The error view to display if CustomView or DefaultView do not exist (could be either due to not found, or unauthorized). Can be null
   */
  ErrorView: ViewFromConfig<AdminViewServerProps>
  View: ViewMap[string]
} => {
  // Conditionally import and lazy load the default view
  let View: ViewMap[string] = null
  const ErrorView: ViewFromConfig<AdminViewServerProps> = null

  const {
    routes: { admin: adminRoute },
  } = config

  const views =
    (collectionConfig && collectionConfig?.admin?.components?.views) ||
    (globalConfig && globalConfig?.admin?.components?.views)

  let baseRoute: string
  let currentRoute: string

  if (globalConfig) {
    const [globalEntity, globalSlug, segment3, ...remainingSegments] = routeSegments

    baseRoute = [adminRoute !== '/' && adminRoute, 'globals', globalSlug].filter(Boolean).join('/')

    currentRoute = [baseRoute, segment3, ...remainingSegments].filter(Boolean).join('/')
  }

  if (collectionConfig) {
    const [collectionEntity, collectionSlug, ...remainingSegments] = routeSegments

    if (!overrideDocPermissions) {
      if (remainingSegments[0] === 'create') {
        if ('create' in docPermissions && docPermissions.create) {
          throw new Error('not-found')
        }
      } else {
        if (!docPermissions?.read) {
          throw new Error('not-found')
        }
      }
    }

    baseRoute = [adminRoute !== '/' && adminRoute, 'collections', collectionSlug]
      .filter(Boolean)
      .join('/')

    currentRoute = [baseRoute, ...remainingSegments].filter(Boolean).join('/')
  }

  const viewMap = createViewMap({
    baseRoute,
    views,
  })

  // use a for...of loop in order to early once a match is found
  for (const [viewPath, ViewComponent] of Object.entries(viewMap)) {
    // try and match the view to the route
    const isMatching = isPathMatchingRoute({
      currentRoute,
      exact: true,
      path: viewPath,
    })

    if (isMatching) {
      View = ViewComponent
      break
    }
  }

  return {
    ErrorView,
    View,
  }
}
