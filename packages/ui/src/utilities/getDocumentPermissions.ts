import type {
  Data,
  PayloadRequest,
  SanitizedCollectionConfig,
  SanitizedDocumentPermissions,
  SanitizedGlobalConfig,
} from 'payload'

import { getPayloadOperation, invokeOperation, logError } from 'payload'
import { hasDraftsEnabled } from 'payload/shared'

import { hasSavePermission as getHasSavePermission } from './hasSavePermission.js'
import { isEditing as getIsEditing } from './isEditing.js'

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

  const getCollectionPermissions = (permissionData: Data) =>
    invokeOperation(getPayloadOperation('collection', 'docAccess'), {
      context: req.payload,
      input: {
        id,
        collection: collectionConfig.slug,
        data: permissionData,
        req,
      },
      validate: false,
    })

  const getGlobalPermissions = (permissionData: Data) =>
    invokeOperation(getPayloadOperation('global', 'docAccess'), {
      context: req.payload,
      input: {
        data: permissionData,
        global: globalConfig.slug,
        req,
      },
      validate: false,
    })

  if (collectionConfig) {
    try {
      docPermissions = await getCollectionPermissions({
        ...data,
        _status: 'draft',
      })

      if (hasDraftsEnabled(collectionConfig)) {
        hasPublishPermission = (
          await getCollectionPermissions({
            ...data,
            _status: 'published',
          })
        ).update
      }

      if (collectionConfig.trash) {
        const { deletedAt: _, ...dataWithoutDeletedAt } = data || {}

        const [trashPermissionResult, deletePermissionResult] = await Promise.all([
          getCollectionPermissions({
            ...data,
            deletedAt: new Date().toISOString(),
          }),
          getCollectionPermissions(dataWithoutDeletedAt),
        ])

        hasTrashPermission = trashPermissionResult.delete
        hasDeletePermission = deletePermissionResult.delete
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
      docPermissions = await getGlobalPermissions(data)

      if (hasDraftsEnabled(globalConfig)) {
        hasPublishPermission = (
          await getGlobalPermissions({
            ...data,
            _status: 'published',
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
