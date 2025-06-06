import type {
  SanitizedCollectionConfig,
  SanitizedCollectionPermission,
  SanitizedConfig,
  SanitizedGlobalConfig,
  SanitizedGlobalPermission,
} from 'payload'

import type { ViewToRender } from './createViewMap.js'

import { NotFoundView } from '../NotFound/index.js'
import { isPathMatchingRoute } from '../Root/isPathMatchingRoute.js'
import { UnauthorizedView } from '../Unauthorized/index.js'
import { createViewMap } from './createViewMap.js'

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
  View: ViewToRender
} => {
  // Conditionally import and lazy load the default view
  let View: ViewToRender = null

  const {
    routes: { admin: adminRoute },
  } = config

  let baseRoute: string
  let currentRoute: string

  if (globalConfig) {
    const [globalEntity, globalSlug, segment3, ...remainingSegments] = routeSegments

    if (!overrideDocPermissions) {
      if (!docPermissions?.read) {
        View = NotFoundView
      }
    }

    baseRoute = [adminRoute !== '/' && adminRoute, 'globals', globalSlug].filter(Boolean).join('/')

    currentRoute = [baseRoute, segment3, ...remainingSegments].filter(Boolean).join('/')
  }

  if (collectionConfig) {
    const [collectionEntity, collectionSlug, ...remainingSegments] = routeSegments

    if (!overrideDocPermissions) {
      if (remainingSegments[0] === 'create') {
        if ('create' in docPermissions && docPermissions.create) {
          View = UnauthorizedView
        }
      } else {
        if (!docPermissions?.read) {
          View = NotFoundView
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
    collectionConfig,
    config,
    globalConfig,
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
    View,
  }
}
