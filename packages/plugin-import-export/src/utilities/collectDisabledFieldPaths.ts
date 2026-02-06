import type { Field } from 'payload'

import { traverseFields } from 'payload'
import { fieldAffectsData } from 'payload/shared'

/**
 * Recursively traverses a Payload field schema to collect all field paths
 * that are explicitly disabled for the import/export plugin via:
 *   field.custom['plugin-import-export'].disabled
 *
 * Handles nested fields including named tabs, groups, arrays, blocks, etc.
 * Tracks each field’s path by storing it in `ref.path` and manually propagating
 * it through named tab layers via a temporary `__manualRef` marker.
 *
 * @param fields - The top-level array of Payload field definitions
 * @returns An array of dot-notated field paths that are marked as disabled
 */
export const collectDisabledFieldPaths = (fields: Field[]): string[] => {
  const disabledPaths: string[] = []

  traverseFields({
    callback: ({ field, next, parentRef, ref }) => {
      // Handle named tabs
      if (field.type === 'tabs' && Array.isArray(field.tabs)) {
        for (const tab of field.tabs) {
          if ('name' in tab && typeof tab.name === 'string') {
            // Build the path prefix for this tab
            const parentPath =
              parentRef && typeof (parentRef as { path?: unknown }).path === 'string'
                ? (parentRef as { path: string }).path
                : ''
            const tabPath = parentPath ? `${parentPath}.${tab.name}` : tab.name

            // Prepare a ref for this named tab's children to inherit the path
            const refObj = ref as Record<string, any>
            const tabRef = refObj[tab.name] ?? {}
            tabRef.path = tabPath
            tabRef.__manualRef = true // flag this as a manually constructed parentRef
            refObj[tab.name] = tabRef
          }
        }

        // Skip further processing of the tab container itself
        return
      }

      // Skip unnamed fields (e.g. rows/collapsibles)
      if (!('name' in field) || typeof field.name !== 'string') {
        return
      }

      // Determine the path to the current field
      let parentPath: string | undefined

      if (
        parentRef &&
        typeof parentRef === 'object' &&
        'path' in parentRef &&
        typeof (parentRef as { path?: unknown }).path === 'string'
      ) {
        parentPath = (parentRef as { path: string }).path
      } else if ((ref as any)?.__manualRef && typeof (ref as any)?.path === 'string') {
        // Fallback: if current ref is a manual tabRef, use its path
        parentPath = (ref as any).path
      }

      const fullPath = parentPath ? `${parentPath}.${field.name}` : field.name

      // Store current path for any nested children to use
      ;(ref as any).path = fullPath

      // If field is a data-affecting field and disabled via plugin config, collect its path
      if (fieldAffectsData(field) && field.custom?.['plugin-import-export']?.disabled) {
        disabledPaths.push(fullPath)
        return next?.()
      }
    },
    fields,
  })

  return disabledPaths
}
