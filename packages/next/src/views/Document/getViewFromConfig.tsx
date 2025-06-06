import type {
  EditViewConfig,
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

  if (collectionConfig) {
    const [, collectionSlug, segment3, ...remainingSegments] = routeSegments

    if (!overrideDocPermissions && !docPermissions?.read) {
      throw new Error('not-found')
    } else {
      if (segment3 === 'create' && 'create' in docPermissions && !docPermissions.create) {
        return {
          View: UnauthorizedView,
        }
      }
    }

    baseRoute = [
      adminRoute !== '/' && adminRoute,
      'collections',
      collectionSlug,
      segment3 !== 'create' ? ':id' : '',
    ]
      .filter(Boolean)
      .join('/')

    currentRoute = [baseRoute, ...remainingSegments].filter(Boolean).join('/')
  }

  if (globalConfig) {
    const [, globalSlug, segment3, ...remainingSegments] = routeSegments

    if (!overrideDocPermissions) {
      if (!docPermissions?.read) {
        return {
          View: NotFoundView,
        }
      }
    }

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
  })

  // use a for...of loop in order to early exit once a match is found
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
