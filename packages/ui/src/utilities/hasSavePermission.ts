import type {
  SanitizedCollectionPermission,
  SanitizedDocumentPermissions,
  SanitizedGlobalPermission,
} from 'payload'

export const hasSavePermission = (args: {
  /*
   * Pass either `collectionSlug` or `globalSlug`
   */
  collectionSlug?: string
  docPermissions: SanitizedDocumentPermissions
  /*
   * Pass either `collectionSlug` or `globalSlug`
   */
  globalSlug?: string
  isEditing: boolean
}) => {
  const { collectionSlug, docPermissions, globalSlug, isEditing } = args

  if (collectionSlug) {
    return Boolean(
      (isEditing && docPermissions?.update) ||
        (!isEditing && (docPermissions as SanitizedCollectionPermission)?.create),
    )
  }

  if (globalSlug) {
    return Boolean((docPermissions as SanitizedGlobalPermission)?.update)
  }

  return false
}
