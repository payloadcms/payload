import type { SanitizedFieldsPermissions } from 'payload'

/**
 * Check if a field has read permission by traversing the permissions structure using a dot-notation path.
 * Handles both top-level fields (e.g., "restrictedField") and nested fields (e.g., "group.restrictedGroupText").
 *
 * The permissions object only contains fields the user can access (fields with read: false are deleted).
 * - If permissions is true, all fields are readable
 * - If field not in permissions, it was filtered out (not readable)
 * - If field in permissions with read: true, it's readable
 * - Otherwise, not readable
 */
export const hasFieldReadPermission = (
  permissions: SanitizedFieldsPermissions,
  path: string,
): boolean => {
  if (permissions === true) {return true}
  if (typeof permissions !== 'object') {return false}

  const pathParts = path.split('.')

  const checkPermission = (currentPerms: any, parts: string[], index: number = 0): boolean => {
    const part = parts[index]
    const isLastPart = index === parts.length - 1

    // Field doesn't exist in permissions - was filtered out
    if (!(part in currentPerms)) {return false}

    const fieldPerm = currentPerms[part]

    // Permission is explicitly true
    if (fieldPerm === true) {return true}

    // At the last part - check for explicit read: true
    if (isLastPart) {
      return typeof fieldPerm === 'object' && fieldPerm.read === true
    }

    // Need to navigate deeper - check if nested fields exist
    if (typeof fieldPerm === 'object' && fieldPerm.fields) {
      return checkPermission(fieldPerm.fields, parts, index + 1)
    }

    // Can't navigate deeper - nested fields were filtered out
    return false
  }

  return checkPermission(permissions, pathParts)
}
