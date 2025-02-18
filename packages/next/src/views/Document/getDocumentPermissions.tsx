import type {
  Data,
  PayloadRequest,
  SanitizedCollectionConfig,
  SanitizedDocumentPermissions,
  SanitizedGlobalConfig,
} from 'payload'

import {
  hasSavePermission as getHasSavePermission,
  isEditing as getIsEditing,
} from '@payloadcms/ui/shared'
import { docAccessOperation, docAccessOperationGlobal, logError } from 'payload'

export const getDocumentPermissions = async (args: {
  collectionConfig?: SanitizedCollectionConfig
  data: Data
  globalConfig?: SanitizedGlobalConfig
  id?: number | string
  req: PayloadRequest
  version?: boolean
}): Promise<{
  docPermissions: SanitizedDocumentPermissions
  hasPublishPermission: boolean
  hasSavePermission: boolean
}> => {
  const { id, collectionConfig, data = {}, globalConfig, req, version = false } = args

  let docPermissions: SanitizedDocumentPermissions
  let hasPublishPermission = false

  if (collectionConfig) {
    try {
      docPermissions = await docAccessOperation({
        id,
        collection: {
          config: collectionConfig,
        },
        req: {
          ...req,
          data: {
            ...data,
            _status: 'draft',
          },
        },
        version,
      })

      if (collectionConfig.versions?.drafts) {
        hasPublishPermission = await docAccessOperation({
          id,
          collection: {
            config: collectionConfig,
          },
          req: {
            ...req,
            data: {
              ...data,
              _status: 'published',
            },
          },
          version,
        }).then((permissions) => permissions.update)
      }
    } catch (err) {
      logError({ err, payload: req.payload })
    }
  }

  if (globalConfig) {
    try {
      docPermissions = await docAccessOperationGlobal({
        globalConfig,
        req: {
          ...req,
          data,
        },
        version,
      })

      if (globalConfig.versions?.drafts) {
        hasPublishPermission = await docAccessOperationGlobal({
          globalConfig,
          req: {
            ...req,
            data: {
              ...data,
              _status: 'published',
            },
          },
          version,
        }).then((permissions) => permissions.update)
      }
    } catch (err) {
      logError({ err, payload: req.payload })
    }
  }

  const hasSavePermission = getHasSavePermission({
    collectionSlug: collectionConfig?.slug,
    docPermissions,
    globalSlug: globalConfig?.slug,
    isEditing: getIsEditing({
      id,
      collectionSlug: collectionConfig?.slug,
      globalSlug: globalConfig?.slug,
    }),
  })

  return {
    docPermissions,
    hasPublishPermission,
    hasSavePermission,
  }
}
