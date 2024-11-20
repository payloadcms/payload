import type {
  CollectionPermission,
  FieldPermissions,
  FieldsPermissions,
  GlobalPermission,
  Permissions,
  SanitizedCollectionPermission,
  SanitizedFieldPermissions,
  SanitizedGlobalPermission,
  SanitizedPermissions,
} from '../auth/types.js'

function areAllFieldsPermissionsTrue(data: FieldsPermissions): boolean {
  const randomNumber = Math.random()

  console.log('Inside areAllFieldsPermissionsTrue for', data, randomNumber)
  let areAllFieldsTrue = true
  for (const key in data) {
    console.log('Checking key', key)
    if (typeof data[key] === 'object') {
      // If any recursive call returns false, the whole function returns false
      if (!areAllPermissionsTrue(data[key])) {
        areAllFieldsTrue = false
      } else {
        ;(data[key] as unknown as SanitizedFieldPermissions) = true
        console.log('Setting key to true', key)
      }
    } else if (data[key] !== true) {
      // If any value is not true, return false
      areAllFieldsTrue = false
    }
  }

  console.log('End areAllFieldsPermissionsTrue', { areAllFieldsTrue }, randomNumber)

  // If all values are true or it's an empty object, return true
  return areAllFieldsTrue
}

/**
 * Check if all permissions in a FieldPermissions object are true on the condition that no nested blocks or fields are present.
 */
function areAllPermissionsTrue(
  data: CollectionPermission | FieldPermissions | GlobalPermission,
): boolean {
  const randomNumber = Math.random()
  console.log('Inside areAllPermissionsTrue for', data, randomNumber)

  let blocksPermissions = true
  if ('blocks' in data && data.blocks) {
    for (const blockSlug in data.blocks) {
      if (typeof data.blocks[blockSlug] === 'object') {
        for (const key in data.blocks[blockSlug]) {
          if (key === 'fields') {
            // If any recursive call returns false, the whole function returns false

            console.log('1 checking field permissions for', blockSlug)
            if (data.blocks[blockSlug].fields) {
              if (!areAllFieldsPermissionsTrue(data.blocks[blockSlug].fields)) {
                blocksPermissions = false
              } else {
                data.blocks[blockSlug].fields = true
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
                console.error('Unexpected object in permissions1', key, data.blocks[blockSlug][key])
              }

              /*
              handle permissions object done
              */
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
      data.blocks = true
    }
  }

  let fieldsPermissions = true
  if (data.fields) {
    console.log('2 checking field permissions')
    if (!areAllFieldsPermissionsTrue(data.fields)) {
      fieldsPermissions = false
    } else {
      data.fields = true
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
        console.error('Unexpected object in permissions', key, data[key])
      }

      /*
      handle permissions object done
      */
    } else if (data[key] !== true) {
      // If any value is not true, return false
      otherPermissions = false
    }
  }

  console.log('End areAllPermissionsTrue for', randomNumber, {
    blocksPermissions,
    fieldsPermissions,
    otherPermissions,
  })

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

    console.log('areAllPermissionsTrue for collection', collectionSlug)
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
    console.log('areAllPermissionsTrue for global', globalSlug)

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
