import type { SanitizedFieldPermissions } from '../auth/types.js'
import type { Field } from '../fields/config/types.js'
import type { Operation } from '../types/index.js'

export const getFieldPermissions = ({
  field,
  operation,
  parentName,
  permissions,
}: {
  field: Field
  operation: Operation
  parentName: string
  permissions:
    | {
        [fieldName: string]: SanitizedFieldPermissions
      }
    | SanitizedFieldPermissions
}): {
  operation: boolean
  permissions: SanitizedFieldPermissions
  read: boolean
} => {
  const hasReadPermission =
    permissions === true ||
    permissions?.read === true ||
    permissions?.[parentName] === true ||
    ('name' in field &&
      typeof permissions === 'object' &&
      permissions?.[field.name] &&
      (permissions[field.name] === true ||
        ('read' in permissions[field.name] && permissions[field.name].read)))

  const hasOperationPermission =
    permissions === true ||
    permissions?.[operation] === true ||
    permissions?.[parentName] === true ||
    ('name' in field &&
      typeof permissions === 'object' &&
      permissions?.[field.name] &&
      (permissions[field.name] === true ||
        (operation in permissions[field.name] && permissions[field.name][operation])))

  const fieldPermissions =
    permissions === undefined || permissions === null || permissions === true
      ? true
      : 'name' in field
        ? permissions?.[field.name]
        : permissions

  return {
    operation: hasOperationPermission,
    permissions: fieldPermissions,
    read: hasReadPermission,
  }
}
