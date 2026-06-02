import type { CollectionConfig } from '../../collections/config/types.js'
import type { Field } from '../../fields/config/types.js'

export function findUseAsTitleField(collectionConfig: CollectionConfig): {
  localized: boolean
  titleFieldName: string
} {
  const titleFieldName = collectionConfig.admin?.useAsTitle || 'id'
  return iterateFields({ fields: collectionConfig.fields, titleFieldName })
}

/**
 * Find a field by name and return its localization status.
 * Returns undefined if field is not found.
 */
export function findFieldByName(
  collectionConfig: CollectionConfig,
  fieldName: string,
): undefined | { fieldName: string; localized: boolean } {
  try {
    const result = iterateFields({ fields: collectionConfig.fields, titleFieldName: fieldName })
    return { fieldName: result.titleFieldName, localized: result.localized }
  } catch {
    return undefined
  }
}

function iterateFields({ fields, titleFieldName }: { fields: Field[]; titleFieldName: string }): {
  localized: boolean
  titleFieldName: string
} {
  let titleField: undefined | { localized: boolean; titleFieldName: string }

  if (titleFieldName === 'id') {
    return {
      localized: false,
      titleFieldName,
    }
  }

  for (const field of fields) {
    switch (field.type) {
      case 'collapsible':
      case 'row':
        {
          const result = iterateFields({ fields: field.fields, titleFieldName })
          if (result) {
            titleField = result
          }
        }
        break
      case 'group':
        if (!('name' in field)) {
          const result = iterateFields({ fields: field.fields, titleFieldName })
          if (result) {
            titleField = result
          }
        }
        break
      case 'number':
      case 'text':
      case 'textarea':
        if (field.name === titleFieldName) {
          return {
            localized: Boolean(field.localized),
            titleFieldName: field.name,
          }
        }
        break
      case 'tabs':
        for (const tab of field.tabs) {
          if (!('name' in tab)) {
            const result = iterateFields({ fields: tab.fields, titleFieldName })
            if (result) {
              titleField = result
            }
          }
        }
    }

    // If we found the field in recursion, return it
    if (titleField) {
      return titleField
    }
  }

  throw new Error(
    `The hierarchy title field "${titleFieldName}" was not found. It cannot be nested within named fields i.e. named groups, named tabs, etc.`,
  )
}
