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

const sanitizePath = ({ baseRoute, path }: { baseRoute: string; path: string }): string => {
  let sanitizedPath = `${baseRoute}${path}`

  // Ensure the path does not end with a slash
  if (sanitizedPath.endsWith('/')) {
    sanitizedPath = sanitizedPath.slice(0, -1)
  }

  return sanitizedPath
}

/**
 * Create a map of all paths that point to the view that should mount on that path.
 * Ensure that all views can be mounted on any given route.
 * E.g. the API view can be mounted on `/my-api` and a custom view can be mounted on the `/api` route.
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
  overrideDocPermissions,
}: {
  baseRoute: string
  collectionConfig?: SanitizedCollectionConfig
  config: SanitizedConfig
  docPermissions?: SanitizedCollectionPermission | SanitizedGlobalPermission
  globalConfig?: SanitizedGlobalConfig
  overrideDocPermissions?: boolean
}): ViewMap => {
  const views =
    (collectionConfig && collectionConfig?.admin?.components?.views) ||
    (globalConfig && globalConfig?.admin?.components?.views)

  const viewMap: ViewMap = Object.entries(views?.edit || {}).reduce((acc, [key, viewConfig]) => {
    const viewDefaults = defaultDocumentViews[key]

    if (viewDefaults?.condition) {
      const shouldContinue =
        viewDefaults.condition({
          collectionConfig,
          config,
          docPermissions,
          globalConfig,
          overrideDocPermissions,
        }) || true

      if (!shouldContinue) {
        return acc
      }
    }

    const pathToUse = sanitizePath({
      baseRoute,
      path: 'path' in viewConfig && viewConfig.path ? viewConfig.path : viewDefaults?.path,
    })

    acc[pathToUse] = {
      View:
        'Component' in viewConfig && viewConfig.Component
          ? viewConfig.Component
          : viewDefaults?.DefaultView,
      viewConfig,
    }

    return acc
  }, {})

  // Map over the defaults to ensure they are also included in the `viewMap` alongside any custom views
  Object.entries(defaultDocumentViews).forEach(([key, defaultViewConfig]) => {
    // Do not override paths that have already been handled, as these have already been added to the map
    // E.g. if a user has added a custom view on the `api` key
    if (!views?.edit?.[key]) {
      if (defaultViewConfig?.condition) {
        const shouldContinue =
          defaultViewConfig.condition({
            collectionConfig,
            config,
            docPermissions,
            globalConfig,
            overrideDocPermissions,
          }) || true

        if (!shouldContinue) {
          return
        }
      }

      const pathToUse = sanitizePath({ baseRoute, path: defaultViewConfig.path })

      viewMap[pathToUse] = {
        key,
        View: defaultViewConfig.DefaultView,
        viewConfig: defaultViewConfig,
      }
    }
  })

  return viewMap
}
