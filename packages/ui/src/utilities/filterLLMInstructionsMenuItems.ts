import type { PayloadComponent, SanitizedPermissions } from 'payload'

import { instructionsCollectionSlug } from 'payload/shared'

export const filterLLMInstructionsMenuItems = ({
  collectionSlug,
  globalSlug,
  menuItems,
  permissions,
}: {
  collectionSlug?: string
  globalSlug?: string
  menuItems?: PayloadComponent[]
  permissions: SanitizedPermissions
}): PayloadComponent[] | undefined => {
  const targetPermissions = collectionSlug
    ? permissions.collections?.[collectionSlug]
    : globalSlug
      ? permissions.globals?.[globalSlug]
      : undefined
  const canEdit = Boolean(
    permissions.collections?.[instructionsCollectionSlug]?.update &&
      targetPermissions?.read &&
      targetPermissions?.update,
  )

  return menuItems?.filter((item) => item !== '@payloadcms/ui#LLMInstructionsMenuItem' || canEdit)
}
