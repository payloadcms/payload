import type { CollectionPermission, DocumentPermissions, GlobalPermission } from 'payload'

export const hasSavePermission = (args: {
  /*
   * Pass either `collectionSlug` or `globalSlug`
   */
  collectionSlug?: string
  docPermissions: DocumentPermissions
  /*
   * Pass either `collectionSlug` or `globalSlug`
   */
  globalSlug?: string
  isEditing: boolean
}) => {
  const { collectionSlug, docPermissions, globalSlug, isEditing } = args

  if (collectionSlug) {
    return Boolean(
      (isEditing && docPermissions?.update?.permission) ||
        (!isEditing && (docPermissions as CollectionPermission)?.create?.permission),
    )
  }

  if (globalSlug) {
    return Boolean((docPermissions as GlobalPermission)?.update?.permission)
  }

  return false
}
