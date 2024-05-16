import type {
  CollectionPermission,
  DocumentPermissions,
  GlobalPermission,
  Permissions,
} from 'payload/auth'

export const hasSavePermission = (args: {
  /*
   * Pass either `collectionSlug` or `globalSlug`
   */
  collectionSlug?: string
  /*
   * Pass either `docPermissions` or `permissions`
   */
  docPermissions?: DocumentPermissions
  /*
   * Pass either `collectionSlug` or `globalSlug`
   */
  globalSlug?: string
  /*
   * Pass only when `collectionSlug` is passed
   */
  id?: number | string
  /*
   * Pass either `docPermissions` or `permissions`
   */
  permissions?: Permissions
}) => {
  const { id, collectionSlug, docPermissions, globalSlug, permissions } = args

  if (collectionSlug) {
    const isEditing = id !== undefined

    const permissionsToUse =
      permissions?.collections?.[collectionSlug] || (docPermissions as CollectionPermission)

    return Boolean(
      (isEditing && permissionsToUse?.update?.permission) ||
        (!isEditing && permissionsToUse?.create?.permission),
    )
  }

  if (globalSlug) {
    const permissionsToUse =
      permissions?.globals?.[globalSlug] || (docPermissions as GlobalPermission)

    return Boolean(permissionsToUse?.update?.permission)
  }

  return false
}
