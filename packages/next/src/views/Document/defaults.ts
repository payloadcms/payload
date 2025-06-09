import type {
  DocumentViewClientProps,
  DocumentViewCondition,
  DocumentViewServerProps,
} from 'payload'

import { UnauthorizedError } from 'payload'

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
    condition?: DocumentViewCondition
    path: string
    View: React.FC<DocumentViewClientProps> | React.FC<DocumentViewServerProps>
  }
} = {
  api: {
    condition: ({ collectionConfig, globalConfig }) =>
      collectionConfig?.admin?.hideAPIURL !== true && globalConfig?.admin?.hideAPIURL !== true,
    path: '/api',
    View: DefaultAPIView,
  },
  default: {
    condition: ({ collectionConfig, docPermissions, routeSegments }) => {
      if (routeSegments[2] === 'create') {
        if (!collectionConfig) {
          return false
        } else if (!('create' in docPermissions) || !docPermissions.create) {
          throw new UnauthorizedError()
        }
      }

      return true
    },
    path: '/',
    View: DefaultEditView,
  },
  livePreview: {
    condition: ({ collectionConfig, config, globalConfig }) =>
      Boolean(
        (collectionConfig && collectionConfig?.admin?.livePreview) ||
          config?.admin?.livePreview?.collections?.includes(collectionConfig?.slug) ||
          (globalConfig && globalConfig?.admin?.livePreview) ||
          config?.admin?.livePreview?.globals?.includes(globalConfig?.slug),
      ),
    path: '/preview',
    View: LivePreviewView,
  },
  version: {
    condition: ({ docPermissions }) => {
      if (!docPermissions?.readVersions) {
        throw new UnauthorizedError()
      }

      return true
    },
    path: '/versions/:versionId',
    View: VersionView,
  },
  versions: {
    condition: ({ docPermissions }) => {
      if (!docPermissions?.readVersions) {
        throw new UnauthorizedError()
      }

      return true
    },
    path: '/versions',
    View: VersionsView,
  },
}
