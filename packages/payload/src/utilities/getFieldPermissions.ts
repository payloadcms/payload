/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  SanitizedDocumentPermissions,
  SanitizedFieldPermissions,
  SanitizedFieldsPermissions,
} from '../auth/types.js'
import type { ClientField, Field } from '../fields/config/types.js'
import type { Operation } from '../types/index.js'

/**
 * Gets read and operation-level permissions for a given field based on cascading field permissions.
 * @returns An object with the following properties:
 * - `operation`: Whether the user has permission to perform the operation on the field (`create` or `update`).
 * - `permissions`: The field-level permissions.
 * - `read`: Whether the user has permission to read the field.
 */
export const getFieldPermissions = ({
  collectionPermissions,
  field,
  operation,
  parentName,
  permissions,
}: {
  readonly collectionPermissions?: SanitizedDocumentPermissions
  readonly field: ClientField | Field
  readonly operation: Operation
  readonly parentName: string
  readonly permissions: SanitizedFieldPermissions | SanitizedFieldsPermissions
}): {
  operation: boolean
  /**
   * The field-level permissions. This can be equal to the permissions passed to the
   * `getFieldPermissions` function if the field has no name.
   */
  permissions: SanitizedFieldPermissions | SanitizedFieldsPermissions
  read: boolean
} => {
  // First, calculate permissions using the existing logic
  const fieldOperation =
    permissions === true ||
    permissions?.[operation as keyof typeof permissions] === true ||
    permissions?.[parentName as keyof typeof permissions] === true ||
    ('name' in field &&
      typeof permissions === 'object' &&
      permissions?.[field.name as keyof typeof permissions] &&
      (permissions[field.name as keyof typeof permissions] === true ||
        (operation in (permissions as any)[field.name] &&
          (permissions as any)[field.name][operation])))

  const fieldPermissions =
    permissions === undefined || permissions === null || permissions === true
      ? true
      : 'name' in field
        ? (permissions as any)[field.name]
        : permissions

  const fieldRead =
    permissions === true ||
    permissions?.read === true ||
    permissions?.[parentName as keyof typeof permissions] === true ||
    ('name' in field &&
      typeof permissions === 'object' &&
      permissions?.[field.name as keyof typeof permissions] &&
      ((permissions as any)[field.name] === true ||
        ('read' in (permissions as any)[field.name] && (permissions as any)[field.name].read)))

  // Check if field permissions are effectively empty/missing
  const hasFieldPermissions =
    permissions === true ||
    (typeof permissions === 'object' && permissions !== null && Object.keys(permissions).length > 0)

  // If no field permissions are defined, fallback to collection permissions
  if (!hasFieldPermissions && collectionPermissions) {
    const collectionRead = Boolean(collectionPermissions.read)
    let collectionOperation = false

    // Check operation-specific permission on collection
    if (operation === 'create' && 'create' in collectionPermissions) {
      collectionOperation = Boolean(collectionPermissions.create)
    } else if (operation === 'update') {
      collectionOperation = Boolean(collectionPermissions.update)
    }

    return {
      operation: collectionOperation,
      permissions: { read: collectionRead } as SanitizedFieldPermissions,
      read: collectionRead,
    }
  }

  // Return the calculated permissions
  return {
    operation: Boolean(fieldOperation),
    permissions: fieldPermissions,
    read: Boolean(fieldRead),
  }
}
