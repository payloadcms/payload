import type { PayloadComponent, PayloadRequest, SanitizedPermissions } from 'payload'

import { docAccessOperation, logError } from 'payload'
import { instructionsCollectionSlug } from 'payload/shared'

export const filterLLMInstructionsMenuItems = async ({
  collectionSlug,
  globalSlug,
  menuItems,
  permissions,
  req,
}: {
  collectionSlug?: string
  globalSlug?: string
  menuItems?: PayloadComponent[]
  permissions: SanitizedPermissions
  req: PayloadRequest
}): Promise<PayloadComponent[] | undefined> => {
  if (!menuItems?.includes('@payloadcms/ui#LLMInstructionsMenuItem')) {
    return menuItems
  }

  const targetPermissions = collectionSlug
    ? permissions.collections?.[collectionSlug]
    : globalSlug
      ? permissions.globals?.[globalSlug]
      : undefined
  const collection = req.payload.collections[instructionsCollectionSlug]
  let canEdit = false

  if (collection && targetPermissions?.read && targetPermissions.update) {
    try {
      const docPermissions = await docAccessOperation({
        id: collectionSlug ? `collection-${collectionSlug}` : `global-${globalSlug}`,
        collection,
        req,
      })

      canEdit = Boolean(docPermissions.read && docPermissions.update)
    } catch (err) {
      logError({ err, payload: req.payload })
    }
  }

  return menuItems?.filter((item) => item !== '@payloadcms/ui#LLMInstructionsMenuItem' || canEdit)
}
