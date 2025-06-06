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

import { APIView as DefaultAPIView } from '../API/index.js'
import { EditView as DefaultEditView } from '../Edit/index.js'
import { LivePreviewView } from '../LivePreview/index.js'
import { VersionView } from '../Version/index.js'
import { VersionsView } from '../Versions/index.js'

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

const defaultDocumentViews: {
  [key: string]: {
    /**
     * A function used to conditionally mount the view.
     */
    condition?: (args: {
      collectionConfig: SanitizedCollectionConfig
      config: SanitizedConfig
      docPermissions?: SanitizedCollectionPermission | SanitizedGlobalPermission
      globalConfig: SanitizedGlobalConfig
      overrideDocPermissions?: boolean
    }) => boolean
    DefaultView: React.FC<DocumentViewClientProps> | React.FC<DocumentViewServerProps>
    path: string
  }
} = {
  api: {
    condition: ({ collectionConfig, globalConfig }) =>
      collectionConfig?.admin?.hideAPIURL !== true && globalConfig?.admin?.hideAPIURL !== true,
    DefaultView: DefaultAPIView,
    path: '/api',
  },
  create: {
    condition: ({ collectionConfig }) => Boolean(collectionConfig),
    DefaultView: DefaultEditView,
    path: '/create',
  },
  default: {
    DefaultView: DefaultEditView,
    path: '/',
  },
  livePreview: {
    condition: ({
      collectionConfig,
      config,
      globalConfig,
    }: {
      collectionConfig: SanitizedCollectionConfig
      config: SanitizedConfig
      globalConfig: SanitizedGlobalConfig
    }) =>
      Boolean(
        (collectionConfig && collectionConfig?.admin?.livePreview) ||
          config?.admin?.livePreview?.collections?.includes(collectionConfig?.slug) ||
          (globalConfig && globalConfig?.admin?.livePreview) ||
          config?.admin?.livePreview?.globals?.includes(globalConfig?.slug),
      ),
    DefaultView: LivePreviewView,
    path: '/preview',
  },
  version: {
    condition: ({ docPermissions, overrideDocPermissions }) =>
      Boolean(!overrideDocPermissions && docPermissions?.readVersions),
    DefaultView: VersionView,
    path: '/versions/:versionId',
  },
  versions: {
    condition: ({ docPermissions, overrideDocPermissions }) =>
      Boolean(!overrideDocPermissions && docPermissions?.readVersions),
    DefaultView: VersionsView,
    path: '/versions',
  },
}

/**
 * Create a map of all paths that point to the view that should mount on that path.
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

    // allow the `api` view's route to mount to `/my-api`, and another view to mount to the `/api` route
    let pathToUse = `${baseRoute}${'path' in viewConfig && viewConfig.path ? viewConfig.path : viewDefaults?.path}`

    if (pathToUse.endsWith('/')) {
      pathToUse = pathToUse.slice(0, -1)
    }

    acc[pathToUse] = {
      View:
        'Component' in viewConfig && viewConfig.Component
          ? viewConfig.Component
          : viewDefaults?.DefaultView,
      viewConfig,
    }

    return acc
  }, {})

  // Map over the defaults to ensure they are included in the viewMap
  Object.entries(defaultDocumentViews).forEach(([key, defaultViewConfig]) => {
    // Do not override path that have already been handled, as these have already been added to the map
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

      let pathToUse = `${baseRoute}${defaultViewConfig.path}`

      if (pathToUse.endsWith('/')) {
        pathToUse = pathToUse.slice(0, -1)
      }

      viewMap[pathToUse] = {
        key,
        View: defaultViewConfig.DefaultView,
        viewConfig: defaultViewConfig,
      }
    }
  })

  return viewMap
}
