import type {
  CollectionPermission,
  FieldPermissions,
  Permission,
  Permissions,
} from '../auth/types.js'

// @todo fix this type
type PermissionObject = {
  [key: string]: any
}

/**
 * Check if all permissions in a FieldPermissions object are true on the condition that no nested blocks or fields are present.
 */
function areAllPermissionsTrue(data: PermissionObject): boolean {
  if (!data.blocks && !data.fields) {
    for (const key in data) {
      if (typeof data[key] === 'object') {
        if ('where' in data[key]) {
          return false
        }

        // If any recursive call returns false, the whole function returns false
        if (!areAllPermissionsTrue(data[key])) {
          return false
        }
      } else if (data[key] !== true) {
        // If any value is not true, return false
        return false
      }
    }
    // If all values are true or it's an empty object, return true
    return true
  }
  return false
}

/**
 * Check if an object is a permission object.
 */
function isPermissionObject(data: PermissionObject): boolean {
  return typeof data === 'object' && 'permission' in data && typeof data['permission'] === 'boolean'
}

/**
 * Recursively remove empty objects from an object.
 */
function cleanEmptyObjects(obj: any): any {
  Object.keys(obj).forEach((key) => {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      // Recursive call
      cleanEmptyObjects(obj[key])
      if (Object.keys(obj[key]).length === 0) {
        // Delete the key if the object is empty
        delete obj[key]
      }
    }
  })
  return obj
}

/**
 * Recursively resolve permissions in an object.
 */
function recursivelySanitizePermissions(obj: PermissionObject): void {
  if (typeof obj !== 'object') return

  Object.entries(obj).forEach(([key, value]) => {
    // Check if it's fields and all permissions are true
    if (key === 'fields' && areAllPermissionsTrue(value)) {
      obj[key] = true
    }

    // Check if the whole object is a permission object
    const isFullPermissionObject = Object.keys(value).every(
      (subKey) =>
        typeof value?.[subKey] === 'object' &&
        'permission' in value[subKey] &&
        !('where' in value[subKey]) &&
        typeof value[subKey]['permission'] === 'boolean',
    )

    if (isFullPermissionObject) {
      if (areAllPermissionsTrue(value)) {
        obj[key] = true
      } else {
        for (const subKey in value) {
          if (value[subKey]['permission'] === true && !('where' in value[subKey])) {
            value[subKey] = true
          } else if (value[subKey]['permission'] === true && 'where' in value[subKey]) {
            // do nothing
          } else {
            delete value[subKey]
          }
        }
      }
    } else if (isPermissionObject(value)) {
      if (value['permission'] === true && !('where' in value)) {
        // If the permission is true and there is no where clause, set the key to true
        obj[key] = true
      } else if (value['permission'] === true && 'where' in value) {
        // otherwise do nothing so we can keep the where clause
      } else {
        delete obj[key]
      }
    } else {
      recursivelySanitizePermissions(value)
    }
  })
}

/**
 * Recursively remove empty objects and false values from an object.
 */
export function sanitizePermissions(data: Permissions): Permissions {
  if (data.canAccessAdmin === false) {
    delete data.canAccessAdmin
  }

  if (data.collections) {
    recursivelySanitizePermissions(data.collections)
  }

  if (data.globals) {
    recursivelySanitizePermissions(data.globals)
  }

  // Run clean up of empty objects at the end
  cleanEmptyObjects(data)
  return data
}
