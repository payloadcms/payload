import { UnauthorizedError } from 'payload'

import { APIView as DefaultAPIView } from '../API/index.js'
import { EditView as DefaultEditView } from '../Edit/index.js'
import { LivePreviewView as DefaultLivePreviewView } from '../LivePreview/index.js'
import { VersionView as DefaultVersionView } from '../Version/index.js'
import { VersionsView as DefaultVersionsView } from '../Versions/index.js'

export const defaultDocumentViews = {
  api: {
    Component: DefaultAPIView,
    condition: ({ collectionConfig, globalConfig }) =>
      (collectionConfig && collectionConfig.admin?.hideAPIURL !== true) ||
      (globalConfig && globalConfig.admin?.hideAPIURL),
  },
  default: {
    Component: DefaultEditView,
    condition: ({ docPermissions }) => {
      if (!('create' in docPermissions) || !docPermissions.create) {
        throw new UnauthorizedError()
      }
    },
  },
  livePreview: {
    Component: DefaultLivePreviewView,
    condition: ({ collectionConfig, config, globalConfig }) =>
      Boolean(
        (collectionConfig &&
          (collectionConfig?.admin?.livePreview ||
            config?.admin?.livePreview?.collections?.includes(collectionConfig?.slug))) ||
          (globalConfig &&
            (globalConfig?.admin?.livePreview ||
              config.admin.livePreview?.globals?.includes(globalConfig?.slug))),
      ),
  },
  version: {
    Component: DefaultVersionView,
    condition: ({ docPermissions }) => {
      if (!docPermissions.readVersions) {
        throw new UnauthorizedError()
      }
    },
  },
  versions: {
    Component: DefaultVersionsView,
    condition: ({ docPermissions }) => {
      if (!docPermissions.readVersions) {
        throw new UnauthorizedError()
      }
    },
  },
}
