/**
 * Recursively removes fields from a deeply nested object based on dot-notation paths.
 *
 * This utility supports removing:
 * - Nested fields in plain objects (e.g., "group.value")
 * - Fields inside arrays of objects (e.g., "group.array.field1")
 *
 * It safely traverses both object and array structures and avoids mutating the original input.
 *
 * @param obj - The original object to clean.
 * @param disabled - An array of dot-separated paths indicating which fields to remove.
 * @returns A deep clone of the original object with specified fields removed.
 */

export const removeDisabledFields = (
  obj: Record<string, unknown>,
  disabled: string[] = [],
): Record<string, unknown> => {
  if (!disabled.length) {
    return obj
  }

  const clone = structuredClone(obj)

  // Process each disabled path independently
  for (const path of disabled) {
    const parts = path.split('.')

    /**
     * Recursively walks the object tree according to the dot path,
     * and deletes the field once the full path is reached.
     *
     * @param target - The current object or array being traversed
     * @param i - The index of the current path part
     */
    const removeRecursively = (target: any, i = 0): void => {
      if (target == null) {
        return
      }

      const key = parts[i]

      // If at the final part of the path, perform the deletion
      if (i === parts.length - 1) {
        // If the current level is an array, delete the key from each item
        if (Array.isArray(target)) {
          for (const item of target) {
            if (item && typeof item === 'object' && key !== undefined) {
              delete item[key as keyof typeof item]
            }
          }
        } else if (typeof target === 'object' && key !== undefined) {
          delete target[key]
        }
        return
      }

      if (key === undefined) {
        return
      }

      // Traverse to the next level in the path
      const next = target[key]

      if (Array.isArray(next)) {
        // If the next value is an array, recurse into each item
        for (const item of next) {
          removeRecursively(item, i + 1)
        }
      } else {
        // Otherwise, continue down the object path
        removeRecursively(next, i + 1)
      }
    }

    removeRecursively(clone)
  }

  return clone
}
