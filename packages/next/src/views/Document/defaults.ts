import type {
  DocumentViewClientProps,
  DocumentViewServerProps,
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

export const defaultDocumentViews: {
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
