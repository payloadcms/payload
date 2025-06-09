import type {
  EditViewConfig,
  SanitizedCollectionConfig,
  SanitizedCollectionPermission,
  SanitizedConfig,
  SanitizedGlobalConfig,
  SanitizedGlobalPermission,
} from 'payload'

import type { ViewToRender } from './createViewMap.js'

import { isPathMatchingRoute } from '../Root/isPathMatchingRoute.js'
import { createViewMap } from './createViewMap.js'

export const getViewFromConfig = ({
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
  View: ViewToRender
  viewConfig?: EditViewConfig
  viewKey?: string
} => {
  // Conditionally import and lazy load the default view
  let View: ViewToRender = null
  let viewConfig: EditViewConfig = {} as EditViewConfig
  let viewKey: string = ''

  const {
    routes: { admin: adminRoute },
  } = config

  let baseRoute: string
  let currentRoute: string

  if (!overrideDocPermissions && !docPermissions?.read) {
    throw new Error('not-found')
  }

  if (collectionConfig) {
    // Skip segment 3 bc it may be `create` and exists in the viewMap as `/:id`
    const [, collectionSlug, , ...remainingSegments] = routeSegments

    baseRoute = [adminRoute !== '/' && adminRoute, 'collections', collectionSlug, ':id']
      .filter(Boolean)
      .join('/')

    currentRoute = [baseRoute, ...remainingSegments].filter(Boolean).join('/')
  }

  if (globalConfig) {
    const [, globalSlug, segment3, ...remainingSegments] = routeSegments
    baseRoute = [adminRoute !== '/' && adminRoute, 'globals', globalSlug].filter(Boolean).join('/')
    currentRoute = [baseRoute, segment3, ...remainingSegments].filter(Boolean).join('/')
  }

  const viewMap = createViewMap({
    baseRoute,
    collectionConfig,
    config,
    docPermissions,
    globalConfig,
    overrideDocPermissions,
    routeSegments,
  })

  // Use a for...of loop in order to early exit once a match is found
  for (const [viewPath, mappedView] of Object.entries(viewMap)) {
    const isMatching = isPathMatchingRoute({
      currentRoute,
      exact: true,
      path: viewPath,
    })

    if (isMatching) {
      View = mappedView.View
      viewConfig = mappedView.viewConfig
      viewKey = mappedView.key
      break
    }
  }

  return {
    View,
    viewConfig,
    viewKey,
  }
}
