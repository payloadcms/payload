import type {
  Data,
  DocumentPermissions,
  PayloadRequest,
  SanitizedCollectionConfig,
  SanitizedDocumentPermissions,
  SanitizedGlobalConfig,
} from 'payload'

import {
  hasSavePermission as getHasSavePermission,
  isEditing as getIsEditing,
} from '@payloadcms/ui/shared'
import { docAccessOperation, docAccessOperationGlobal, sanitizePermissions } from 'payload'

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

  let docPermissions: DocumentPermissions
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
        }).then(({ update }) => update?.permission)
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
        }).then(({ update }) => update?.permission)
      }
    } catch (error) {
      req.payload.logger.error(error)
    }
  }

  // TODO: do this in a better way. Only doing this bc this is how the fn was written (mutates the original object)
  const sanitizedDocPermissions = { ...docPermissions } as any as SanitizedDocumentPermissions
  sanitizePermissions(sanitizedDocPermissions)

  const hasSavePermission = getHasSavePermission({
    collectionSlug: collectionConfig?.slug,
    docPermissions: sanitizedDocPermissions,
    globalSlug: globalConfig?.slug,
    isEditing: getIsEditing({
      id,
      collectionSlug: collectionConfig?.slug,
      globalSlug: globalConfig?.slug,
    }),
  })

  return {
    docPermissions: sanitizedDocPermissions,
    hasPublishPermission,
    hasSavePermission,
  }
}
