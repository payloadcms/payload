/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  SanitizedDocumentPermissions,
  SanitizedFieldPermissions,
  SanitizedFieldsPermissions,
} from '../auth/types.js'
import type { ClientField, Field } from '../fields/config/types.js'
import type { Operation } from '../types/index.js'

type SparseOperationResults = Partial<Record<'create' | 'read' | 'update', boolean>>

/**
 * Key of the inherited create/read/update results in a sparse `fields` or `blocks` level.
 * Field names cannot start with `$` (MongoDB), so this key never collides with a field.
 */
export const INHERITED_PERMISSIONS_KEY = '$inherit'

export const isSparseFieldPermissions = (
  permissions: unknown,
): permissions is {
  [INHERITED_PERMISSIONS_KEY]: SparseOperationResults
} & SanitizedFieldsPermissions =>
  typeof permissions === 'object' &&
  permissions !== null &&
  INHERITED_PERMISSIONS_KEY in permissions

// Readers resolve the same keys on every render; caching per level keeps resolved nodes
// referentially stable.
const resolvedByLevel = new WeakMap<object, Map<string, SanitizedFieldPermissions>>()

const resolveSparse = (level: any, key: string): SanitizedFieldPermissions => {
  const own = level[key]

  if (own === true) {
    return true
  }

  const inherited: SparseOperationResults = level[INHERITED_PERMISSIONS_KEY]
  const effective: SparseOperationResults = {}
  let allAllowed = true
  let overridden = false

  for (const operation in inherited) {
    const op = operation as keyof SparseOperationResults

    effective[op] = own && op in own ? own[op] : inherited[op]
    allAllowed &&= Boolean(effective[op])
    overridden ||= effective[op] !== inherited[op]
  }

  if (allAllowed && !own?.fields && !own?.blocks) {
    return true
  }

  const values = overridden ? effective : inherited
  const childLevel = (overrides: any) =>
    overrides === true ? true : { ...overrides, [INHERITED_PERMISSIONS_KEY]: values }

  return {
    ...values,
    blocks: childLevel(own?.blocks),
    fields: childLevel(own?.fields),
  } as SanitizedFieldPermissions
}

/**
 * Resolves `key` inside a `fields` or `blocks` permissions level. In a sparse level an operation
 * missing on the entry inherits the level's value. Returns `true` when every operation is allowed
 * and nothing below overrides it, otherwise a node whose `fields` and `blocks` levels carry the
 * resolved values for their own children. Levels without INHERITED_PERMISSIONS_KEY keep the plain
 * lookup.
 */
export const resolveFieldPermissions = (
  level: unknown,
  key: string,
): SanitizedFieldPermissions | undefined => {
  if (!isSparseFieldPermissions(level)) {
    return level === true ? true : (level as any)?.[key]
  }

  let resolved = resolvedByLevel.get(level)

  if (!resolved) {
    resolved = new Map()
    resolvedByLevel.set(level, resolved)
  }

  let node = resolved.get(key)

  if (node === undefined) {
    node = resolveSparse(level, key)
    resolved.set(key, node)
  }

  return node
}

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
  if (isSparseFieldPermissions(permissions)) {
    const node: any =
      'name' in field && field.name ? resolveFieldPermissions(permissions, field.name) : permissions
    const effective = node === true ? true : (node[INHERITED_PERMISSIONS_KEY] ?? node)

    return {
      operation: effective === true || Boolean(effective[operation]),
      permissions: node,
      read: effective === true || Boolean(effective.read),
    }
  }

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
