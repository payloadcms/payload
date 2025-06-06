import type {
  DocumentViewClientProps,
  DocumentViewServerProps,
  EditViewComponent,
  PayloadComponent,
  SanitizedCollectionConfig,
  SanitizedConfig,
  SanitizedGlobalConfig,
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
  [path: string]: ViewToRender
}

const defaultViews: {
  [key: string]: {
    /**
     * A function used to conditionally mount the view.
     */
    condition?: (args: {
      collectionConfig: SanitizedCollectionConfig
      config: SanitizedConfig
      globalConfig: SanitizedGlobalConfig
    }) => boolean
    DefaultView: React.FC<DocumentViewClientProps> | React.FC<DocumentViewServerProps>
    path: string
  }
} = {
  api: {
    condition: ({ collectionConfig, globalConfig }) =>
      collectionConfig?.admin?.hideAPIURL !== true && globalConfig?.admin?.hideAPIURL !== true,
    DefaultView: DefaultAPIView,
    path: '/:id/api',
  },
  create: {
    DefaultView: DefaultEditView,
    path: '/create',
  },
  default: {
    DefaultView: DefaultEditView,
    path: '/:id',
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
    path: '/:id/preview',
  },
  version: {
    condition: ({ docPermissions, overrideDocPermissions }) =>
      Boolean(!overrideDocPermissions && docPermissions?.readVersions),
    DefaultView: VersionView,
    path: '/:id/versions/:versionId',
  },
  versions: {
    condition: ({ docPermissions, overrideDocPermissions }) =>
      Boolean(!overrideDocPermissions && docPermissions?.readVersions),
    DefaultView: VersionsView,
    path: '/:id/versions',
  },
}

/**
 * Create a map of all paths that point to the view that should mount on that path.
 * @returns {ViewMap}
 * @example
 * {
 *   '/admin/collections/posts/:id': React.FC,
 *   '/admin/collections/posts/:id/api': React.FC,
 * }
 */
export const createViewMap = ({
  baseRoute,
  collectionConfig,
  config,
  globalConfig,
}: {
  baseRoute: string
  collectionConfig?: SanitizedCollectionConfig
  config: SanitizedConfig
  globalConfig?: SanitizedGlobalConfig
}): ViewMap => {
  const views =
    (collectionConfig && collectionConfig?.admin?.components?.views) ||
    (globalConfig && globalConfig?.admin?.components?.views)

  const viewMap: ViewMap = Object.entries(views?.edit || {}).reduce((acc, [key, viewConfig]) => {
    const viewDefaults = defaultViews[key]

    if (viewDefaults?.condition) {
      const shouldContinue = viewDefaults.condition({
        collectionConfig,
        config,
        globalConfig,
      })

      if (!shouldContinue) {
        return acc
      }
    }

    // Allow the `api` view's route to mount to `/my-api`, and another view to mount to the `/api` route
    const pathToUse = `${baseRoute}${'path' in viewConfig && viewConfig.path ? `/:id${viewConfig.path}` : viewDefaults?.path}`

    acc[pathToUse] =
      'Component' in viewConfig && viewConfig.Component
        ? viewConfig.Component
        : viewDefaults?.DefaultView

    return acc
  }, {})

  // Map over the defaults to ensure they are included in the viewMap
  Object.entries(defaultViews).forEach(([key, defaultViewConfig]) => {
    // Do not override path that have already been handled, as these have already been added to the map
    if (!views?.edit?.[key]) {
      const shouldContinue =
        defaultViewConfig?.condition({
          collectionConfig,
          config,
          globalConfig,
        }) || true // default to true if no condition is provided

      if (!shouldContinue) {
        return
      }

      const pathToUse = `${baseRoute}${defaultViewConfig.path}`
      viewMap[pathToUse] = defaultViewConfig.DefaultView
    }
  })

  return viewMap
}
