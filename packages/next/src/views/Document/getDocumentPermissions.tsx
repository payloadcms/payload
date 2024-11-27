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
import { docAccessOperation, docAccessOperationGlobal } from 'payload'

export const getDocumentPermissions = async (args: {
  collectionConfig?: SanitizedCollectionConfig
  data: Data
  globalConfig?: SanitizedGlobalConfig
  id?: number | string
  req: PayloadRequest
}): Promise<{
  docPermissions: SanitizedDocumentPermissions
  hasPublishPermission: boolean
  hasSavePermission: boolean
}> => {
  const { id, collectionConfig, data = {}, globalConfig, req } = args

  let docPermissions: SanitizedDocumentPermissions
  let hasPublishPermission = false

  if (collectionConfig) {
    try {
      docPermissions = await docAccessOperation({
        id: id?.toString(),
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
      })

      if (collectionConfig.versions?.drafts) {
        hasPublishPermission = await docAccessOperation({
          id: id?.toString(),
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
        }).then((permissions) => permissions.update)
      }
    } catch (error) {
      req.payload.logger.error(error)
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
        }).then((permissions) => permissions.update)
      }
    } catch (error) {
      req.payload.logger.error(error)
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
