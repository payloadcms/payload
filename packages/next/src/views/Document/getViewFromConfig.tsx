import type {
  EditViewConfig,
  SanitizedCollectionConfig,
  SanitizedCollectionPermission,
  SanitizedConfig,
  SanitizedGlobalConfig,
  SanitizedGlobalPermission,
} from 'payload'

import type { ViewToRender } from './createDocumentViewMap.js'

import { NotFoundView } from '../NotFound/index.js'
import { isPathMatchingRoute } from '../Root/isPathMatchingRoute.js'
import { UnauthorizedView } from '../Unauthorized/index.js'
import { createDocumentViewMap } from './createDocumentViewMap.js'

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
  viewConfig: EditViewConfig
  viewKey: string
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

  if (globalConfig) {
    const [, globalSlug, segment3, ...remainingSegments] = routeSegments

    if (!overrideDocPermissions) {
      if (!docPermissions?.read) {
        View = NotFoundView
      }
    }

    baseRoute = [adminRoute !== '/' && adminRoute, 'globals', globalSlug].filter(Boolean).join('/')

    currentRoute = [baseRoute, segment3, ...remainingSegments].filter(Boolean).join('/')
  }

  if (collectionConfig) {
    const [, collectionSlug, ...remainingSegments] = routeSegments

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

  const viewMap = createDocumentViewMap({
    baseRoute,
    collectionConfig,
    config,
    docPermissions,
    globalConfig,
    overrideDocPermissions,
  })

  // use a for...of loop in order to early once a match is found
  for (const [viewPath, MappedView] of Object.entries(viewMap)) {
    const isMatching = isPathMatchingRoute({
      currentRoute,
      exact: true,
      path: viewPath,
    })

    if (isMatching) {
      View = MappedView.View
      viewConfig = MappedView.viewConfig
      viewKey = MappedView.key
      break
    }
  }

  return {
    View,
    viewConfig,
    viewKey,
  }
}
