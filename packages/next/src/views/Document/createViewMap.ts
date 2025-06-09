import type {
  DocumentViewClientProps,
  DocumentViewServerProps,
  EditViewComponent,
  EditViewConfig,
  PayloadComponent,
  SanitizedCollectionConfig,
  SanitizedCollectionPermission,
  SanitizedConfig,
  SanitizedGlobalConfig,
  SanitizedGlobalPermission,
} from 'payload'

import { UnauthorizedError } from 'payload'

import { UnauthorizedView } from '../Unauthorized/index.js'
import { defaultDocumentViews } from './defaults.js'

export type ViewToRender =
  | EditViewComponent
  | PayloadComponent<DocumentViewServerProps>
  | React.FC
  | React.FC<DocumentViewClientProps>

export type ViewMap = {
  [path: string]: {
    key: string
    View: ViewToRender
    viewConfig: EditViewConfig
  }
}

const sanitizePath = ({
  baseRoute,
  path,
  viewKey,
}: {
  baseRoute: string
  path: string
  viewKey: string
}): string => {
  let sanitizedPath = `${baseRoute}${path}`

  // Handle the `create` view differently, as it needs to be mounted to `/create`, not `/:id/create`
  if (viewKey === 'create' && baseRoute.endsWith('/:id')) {
    sanitizedPath = `${baseRoute.slice(0, -5)}/create`
  }

  // Ensure the path does not end with a slash
  if (sanitizedPath.endsWith('/')) {
    sanitizedPath = sanitizedPath.slice(0, -1)
  }

  return sanitizedPath
}

/**
 * Create a map of all available routes and their respective views.
 * @returns {ViewMap}
 * @example
 * {
 *   '/admin/collections/posts/:id': {
 *     View: React.FC,
 *     viewConfig: EditViewConfig
 *   },
 * }
 */
export const createViewMap = ({
  baseRoute,
  collectionConfig,
  config,
  docPermissions,
  globalConfig,
  routeSegments,
}: {
  baseRoute: string
  collectionConfig?: SanitizedCollectionConfig
  config: SanitizedConfig
  docPermissions?: SanitizedCollectionPermission | SanitizedGlobalPermission
  globalConfig?: SanitizedGlobalConfig
  routeSegments: string[]
}): ViewMap => {
  const customViews =
    (collectionConfig && collectionConfig?.admin?.components?.views) ||
    (globalConfig && globalConfig?.admin?.components?.views)

  const viewKeys = new Set([
    ...Object.keys(customViews?.edit || {}),
    ...Object.keys(defaultDocumentViews),
  ])

  const viewMap: ViewMap = {}

  viewKeys.forEach((key) => {
    const viewDefaults = defaultDocumentViews[key]

    const customViewConfig = customViews?.edit?.[key]

    let View =
      customViewConfig && 'Component' in customViewConfig && customViewConfig.Component
        ? customViewConfig.Component
        : viewDefaults?.View

    if (typeof viewDefaults?.condition === 'function') {
      try {
        const shouldContinue = viewDefaults?.condition({
          collectionConfig,
          config,
          docPermissions,
          globalConfig,
          routeSegments,
        })

        // If the condition is false, do not add this view to the map so that it 404s
        if (shouldContinue === false) {
          return
        }
      } catch (error) {
        // If the condition throws an unauthorized error, we should still add the view
        if (error instanceof UnauthorizedError) {
          View = UnauthorizedView
        }
      }
    }

    const pathToUse = sanitizePath({
      baseRoute,
      path: customViewConfig?.path !== undefined ? customViewConfig.path : viewDefaults?.path,
      viewKey: key,
    })

    viewMap[pathToUse] = {
      key,
      View,
      viewConfig: customViewConfig || viewDefaults,
    }
  })

  return viewMap
}
