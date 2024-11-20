import type {
  CollectionPermission,
  FieldPermissions,
  FieldsPermissions,
  GlobalPermission,
  Permissions,
  SanitizedBlocksPermissions,
  SanitizedCollectionPermission,
  SanitizedFieldPermissions,
  SanitizedFieldsPermissions,
  SanitizedGlobalPermission,
  SanitizedPermissions,
} from '../auth/types.js'

function areAllFieldsPermissionsTrue(data: FieldsPermissions): boolean {
  let areAllFieldsTrue = true
  for (const key in data) {
    if (typeof data[key] === 'object') {
      // If any recursive call returns false, the whole function returns false
      if (!areAllPermissionsTrue(data[key])) {
        areAllFieldsTrue = false
      } else {
        ;(data[key] as unknown as SanitizedFieldPermissions) = true
      }
    } else if (data[key] !== true) {
      // If any value is not true, return false
      areAllFieldsTrue = false
    }
  }

  // If all values are true or it's an empty object, return true
  return areAllFieldsTrue
}

/**
 * Check if all permissions in a FieldPermissions object are true on the condition that no nested blocks or fields are present.
 */
function areAllPermissionsTrue(
  data: CollectionPermission | FieldPermissions | GlobalPermission,
): boolean {
  let blocksPermissions = true
  if ('blocks' in data && data.blocks) {
    for (const blockSlug in data.blocks) {
      if (typeof data.blocks[blockSlug] === 'object') {
        for (const key in data.blocks[blockSlug]) {
          if (key === 'fields') {
            // If any recursive call returns false, the whole function returns false

            if (data.blocks[blockSlug].fields) {
              if (!areAllFieldsPermissionsTrue(data.blocks[blockSlug].fields)) {
                blocksPermissions = false
              } else {
                ;(data.blocks[blockSlug].fields as unknown as SanitizedFieldsPermissions) = true
              }
            }
          } else {
            if (typeof data.blocks[blockSlug][key] === 'object') {
              /*
              handle permissions object
              */
              if (isPermissionObject(data.blocks[blockSlug][key])) {
                if (
                  data.blocks[blockSlug][key]['permission'] === true &&
                  !('where' in data.blocks[blockSlug][key])
                ) {
                  // If the permission is true and there is no where clause, set the key to true
                  data.blocks[blockSlug][key] = true
                  continue
                } else if (
                  data.blocks[blockSlug][key]['permission'] === true &&
                  'where' in data.blocks[blockSlug][key]
                ) {
                  // otherwise do nothing so we can keep the where clause
                  blocksPermissions = false
                } else {
                  blocksPermissions = false
                  data.blocks[blockSlug][key] = false
                  delete data.blocks[blockSlug][key]
                  continue
                }
              } else {
                throw new Error('Unexpected object in block permissions')
              }
            }
          }
        }
      } else if (data.blocks[blockSlug] !== true) {
        // If any value is not true, return false
        blocksPermissions = false
        delete data.blocks[blockSlug]
      }
    }
    if (blocksPermissions) {
      ;(data.blocks as unknown as SanitizedBlocksPermissions) = true
    }
  }

  let fieldsPermissions = true
  if (data.fields) {
    if (!areAllFieldsPermissionsTrue(data.fields)) {
      fieldsPermissions = false
    } else {
      ;(data.fields as unknown as SanitizedFieldsPermissions) = true
    }
  }

  let otherPermissions = true
  for (const key in data) {
    if (key === 'fields' || key === 'blocks') {
      continue
    }
    if (typeof data[key] === 'object') {
      /*
      handle permissions object
      */
      if (isPermissionObject(data[key])) {
        if (data[key]['permission'] === true && !('where' in data[key])) {
          // If the permission is true and there is no where clause, set the key to true
          data[key] = true
          continue
        } else if (data[key]['permission'] === true && 'where' in data[key]) {
          // otherwise do nothing so we can keep the where clause
          otherPermissions = false
        } else {
          otherPermissions = false
          data[key] = false
          delete data[key]
          continue
        }
      } else {
        throw new Error('Unexpected object in fields permissions')
      }

      /*
      handle permissions object done
      */
    } else if (data[key] !== true) {
      // If any value is not true, return false
      otherPermissions = false
    }
  }

  // If all values are true or it's an empty object, return true
  return fieldsPermissions && blocksPermissions && otherPermissions
}

/**
 * Check if an object is a permission object.
 */
function isPermissionObject(data: unknown): boolean {
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

export function recursivelySanitizeCollections(obj: Permissions['collections']): void {
  if (typeof obj !== 'object') {
    return
  }

  const entries = Object.entries(obj)

  for (let i = 0; i < entries.length; i++) {
    const [collectionSlug, collectionPermission] = entries[i]

    if (areAllPermissionsTrue(collectionPermission)) {
      ;(obj[collectionSlug] as unknown as SanitizedCollectionPermission) = true
      continue
    }
  }
}

export function recursivelySanitizeGlobals(obj: Permissions['globals']): void {
  if (typeof obj !== 'object') {
    return
  }

  const entries = Object.entries(obj)

  for (let i = 0; i < entries.length; i++) {
    const [globalSlug, globalPermission] = entries[i]

    if (areAllPermissionsTrue(globalPermission)) {
      ;(obj[globalSlug] as unknown as SanitizedGlobalPermission) = true
      continue
    }
  }
}

/**
 * Recursively remove empty objects and false values from an object.
 */
export function sanitizePermissions(data: Permissions): SanitizedPermissions {
  if (data.canAccessAdmin === false) {
    delete data.canAccessAdmin
  }

  if (data.collections) {
    recursivelySanitizeCollections(data.collections)
  }

  if (data.globals) {
    recursivelySanitizeGlobals(data.globals)
  }

  // Run clean up of empty objects at the end
  cleanEmptyObjects(data)

  return data as unknown as SanitizedPermissions
}
