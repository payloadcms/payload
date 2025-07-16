import { fieldAffectsData } from 'payload/shared'

export const collectDisabledFieldPaths = (fields: any[], path: string[] = []): string[] => {
  const disabledPaths: string[] = []

  for (const field of fields) {
    const currentPath = [...path, field.name]
    const currentPathStr = currentPath.join('.')

    if (fieldAffectsData(field)) {
      if (field.custom?.['plugin-import-export']?.disabled) {
        // Push only the parent accessor, and skip collecting subfields
        disabledPaths.push(currentPathStr)
        continue // prevent recursion
      }
    }

    // Blocks
    if (field.type === 'blocks' && Array.isArray(field.blocks)) {
      for (const block of field.blocks) {
        const blockPath = [...currentPath] // same base as the blocks field
        disabledPaths.push(...collectDisabledFieldPaths(block.fields, blockPath))
      }
    }

    // Recurse into subfields
    if (field.fields) {
      disabledPaths.push(...collectDisabledFieldPaths(field.fields, currentPath))
    }

    // Tabs
    if (field.type === 'tabs' && Array.isArray(field.tabs)) {
      for (const tab of field.tabs) {
        if ('fields' in tab) {
          const tabPath = tab.name ? [...path, tab.name] : path
          disabledPaths.push(...collectDisabledFieldPaths(tab.fields, tabPath))
        }
      }
    }
  }

  return disabledPaths
}
