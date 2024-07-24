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
function cleanEmptyObjects(obj: any): void {
  Object.keys(obj).forEach((key) => {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      // Recursive call
      cleanEmptyObjects(obj[key])
      if (Object.keys(obj[key]).length === 0) {
        // Delete the key if the object is empty
        delete obj[key]
      }
    } else if (obj[key] === null || obj[key] === undefined) {
      delete obj[key]
    }
  })
}

/**
 * Recursively resolve permissions in an object.
 */
export function recursivelySanitizePermissions(obj: PermissionObject): void {
  if (typeof obj !== 'object') return

  const entries = Object.entries(obj)

  for (let i = 0; i < entries.length; i++) {
    const [key, value] = entries[i]
    // Check if it's a 'fields' key
    if (key === 'fields') {
      // Check if fields is empty
      if (Object.keys(obj[key]).length === 0) {
        delete obj[key]
        continue
      }
      // Otherwise set fields to true if all permissions are true
      else if (areAllPermissionsTrue(value)) {
        obj[key] = true
        continue
      }
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
        continue
      } else {
        for (const subKey in value) {
          if (value[subKey]['permission'] === true && !('where' in value[subKey])) {
            value[subKey] = true
            continue
          } else if (value[subKey]['permission'] === true && 'where' in value[subKey]) {
            // do nothing
          } else {
            delete value[subKey]
            continue
          }
        }
      }
    } else if (isPermissionObject(value)) {
      if (value['permission'] === true && !('where' in value)) {
        // If the permission is true and there is no where clause, set the key to true
        obj[key] = true
        continue
      } else if (value['permission'] === true && 'where' in value) {
        // otherwise do nothing so we can keep the where clause
      } else {
        delete obj[key]
        continue
      }
    } else {
      recursivelySanitizePermissions(value)
    }
  }
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
