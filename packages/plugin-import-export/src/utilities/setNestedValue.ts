/**
 * Sets a value deeply into a nested object or array, based on a dot-notation path.
 *
 * This function:
 * - Supports array indexing (e.g., "array.0.field1")
 * - Creates intermediate arrays/objects as needed
 * - Mutates the target object directly
 *
 * @example
 * const obj = {}
 * setNestedValue(obj, 'group.array.0.field1', 'hello')
 * // Result: { group: { array: [ { field1: 'hello' } ] } }
 *
 * @param obj - The target object to mutate.
 * @param path - A dot-separated string path indicating where to assign the value.
 * @param value - The value to set at the specified path.
 */

export const setNestedValue = (
  obj: Record<string, unknown>,
  path: string,
  value: unknown,
): void => {
  const parts = path.split('.')
  let current: unknown = obj

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    const isLast = i === parts.length - 1
    const isIndex = !Number.isNaN(Number(part))

    if (isIndex) {
      const index = Number(part)

      // Ensure the current target is an array
      if (!Array.isArray(current)) {
        current = []
      }

      const currentArray = current as unknown[]

      // Ensure the array slot is initialized
      if (!currentArray[index]) {
        currentArray[index] = {}
      }

      if (isLast) {
        currentArray[index] = value
      } else {
        current = currentArray[index]
      }
    } else {
      const currentObj = current as Record<string, unknown>

      // Ensure the object key exists
      if (isLast) {
        if (typeof part === 'string') {
          currentObj[part] = value
        }
      } else {
        if (typeof currentObj[part as string] !== 'object' || currentObj[part as string] === null) {
          currentObj[part as string] = {}
        }

        current = currentObj[part as string]
      }
    }
  }
}
