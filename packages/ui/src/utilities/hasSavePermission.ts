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
      (isEditing && (docPermissions === true || docPermissions?.update)) ||
        (!isEditing &&
          (docPermissions === true ||
            (docPermissions as Extract<SanitizedCollectionPermission, object>).create)),
    )
  }

  if (globalSlug) {
    return Boolean(
      docPermissions === true ||
        (docPermissions as Extract<SanitizedGlobalPermission, object>)?.update,
    )
  }

  return false
}
