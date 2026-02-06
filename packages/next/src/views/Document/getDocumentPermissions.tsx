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
import { hasDraftsEnabled } from 'payload/shared'

export const getDocumentPermissions = async (args: {
  collectionConfig?: SanitizedCollectionConfig
  data: Data
  globalConfig?: SanitizedGlobalConfig
  /**
   * When called for creating a new document, id is not provided.
   */
  id?: number | string
  req: PayloadRequest
}): Promise<{
  docPermissions: SanitizedDocumentPermissions
  hasDeletePermission: boolean
  hasPublishPermission: boolean
  hasSavePermission: boolean
  hasTrashPermission: boolean
}> => {
  const { id, collectionConfig, data = {}, globalConfig, req } = args

  let docPermissions: SanitizedDocumentPermissions
  let hasPublishPermission = false
  let hasTrashPermission = false
  let hasDeletePermission = false

  if (collectionConfig) {
    try {
      docPermissions = await docAccessOperation({
        id,
        collection: {
          config: collectionConfig,
        },
        data: {
          ...data,
          _status: 'draft',
        },
        req,
      })

      if (hasDraftsEnabled(collectionConfig)) {
        hasPublishPermission = (
          await docAccessOperation({
            id,
            collection: {
              config: collectionConfig,
            },
            data: {
              ...data,
              _status: 'published',
            },
            req,
          })
        ).update
      }

      if (collectionConfig.trash) {
        hasTrashPermission = (
          await docAccessOperation({
            id,
            collection: {
              config: collectionConfig,
            },
            data: {
              ...data,
              deletedAt: new Date().toISOString(),
            },
            req,
          })
        ).delete

        const { deletedAt: _, ...dataWithoutDeletedAt } = data

        hasDeletePermission = (
          await docAccessOperation({
            id,
            collection: {
              config: collectionConfig,
            },
            data: dataWithoutDeletedAt,
            req,
          })
        ).delete
      } else {
        // When trash is not enabled, delete permission is straightforward
        hasDeletePermission = 'delete' in docPermissions ? Boolean(docPermissions.delete) : false
        hasTrashPermission = false
      }
    } catch (err) {
      logError({ err, payload: req.payload })
    }
  }

  if (globalConfig) {
    try {
      docPermissions = await docAccessOperationGlobal({
        data,
        globalConfig,
        req,
      })

      if (hasDraftsEnabled(globalConfig)) {
        hasPublishPermission = (
          await docAccessOperationGlobal({
            data: {
              ...data,
              _status: 'published',
            },
            globalConfig,
            req,
          })
        ).update
      }

      // Globals don't support trash
      hasDeletePermission = false
      hasTrashPermission = false
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
    hasDeletePermission,
    hasPublishPermission,
    hasSavePermission,
    hasTrashPermission,
  }
}
