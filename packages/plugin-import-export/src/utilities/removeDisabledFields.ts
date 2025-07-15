/**
 * Recursively removes fields from a deeply nested object based on dot-notation paths.
 *
 * @param obj - The original object to clean.
 * @param disabled - An array of dot-separated paths indicating which fields to remove (e.g., "group.value").
 * @returns A deep clone of the original object with specified fields removed.
 */

export const removeDisabledFields = (
  obj: Record<string, unknown>,
  disabled: string[] = [],
): Record<string, unknown> => {
  // If there are no disabled paths, return the original object as-is
  if (!disabled.length) {
    return obj
  }

  // Deep clone the input to avoid mutating the original object
  const clone = structuredClone(obj)

  // Iterate through each disabled path
  disabled.forEach((path) => {
    const parts = path.split('.')

    // Handle simple top-level keys directly
    if (parts.length === 1) {
      const key = parts[0]
      if (typeof key !== 'undefined') {
        delete clone[key]
      }
      return
    }

    // Traverse down to the parent of the target field
    let cursor: any = clone
    for (let i = 0; i < parts.length - 1; i++) {
      cursor = cursor?.[parts[i] as string]

      // Exit early if path is invalid or hits a non-object
      if (typeof cursor !== 'object' || cursor === null) {
        return
      }
    }

    // Delete the target field if the parent exists
    delete cursor[parts.at(-1)!]
  })

  return clone
}
