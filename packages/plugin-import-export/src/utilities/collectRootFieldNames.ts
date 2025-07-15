import type { Field } from 'payload'

/**
 * Recursively collects all top-level field names.
 * This includes named fields and fields nested within collapsible, row, group, and tab containers.
 *
 * @param fields - Array of Payload field configs to scan
 * @returns Flat array of field names
 */
export const collectRootFieldNames = (fields: Field[]): string[] => {
  const names: string[] = []

  fields.forEach((f) => {
    // If this is a named field, add it to the result
    if ('name' in f && typeof f.name === 'string' && f.name) {
      names.push(f.name)
      return
    }

    // Recursively collect names from presentational containers
    if (f.type === 'collapsible' || f.type === 'row' || f.type === 'group') {
      names.push(...collectRootFieldNames(f.fields ?? []))
      // Recursively collect names from tab fields
    } else if (f.type === 'tabs') {
      f.tabs?.forEach((tab) => names.push(...collectRootFieldNames(tab.fields ?? [])))
    }
  })

  return names
}
