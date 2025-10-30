import type { SanitizedConfig } from '../config/types.js'
import type { FlattenedField } from '../fields/config/types.js'

/**
 * Get the field from by its path.
 * Can accept nested paths, e.g: group.title, array.group.title
 * If there were any localized on the path, pathHasLocalized will be true and localizedPath will look like:
 * group.<locale>.title // group is localized here
 */
export const getFieldByPath = ({
  config,
  fields,
  includeRelationships = false,
  localizedPath = '',
  path,
}: {
  config?: SanitizedConfig
  fields: FlattenedField[]
  includeRelationships?: boolean
  localizedPath?: string
  path: string
}): {
  field: FlattenedField
  localizedPath: string
  pathHasLocalized: boolean
} | null => {
  let currentFields: FlattenedField[] = fields

  let currentField: FlattenedField | null = null

  const segments = path.split('.')

  let pathHasLocalized = false

  while (segments.length > 0) {
    const segment = segments.shift()
    localizedPath = `${localizedPath ? `${localizedPath}.` : ''}${segment}`
    const field = currentFields.find((each) => each.name === segment)

    if (!field) {
      return null
    }

    if (field.localized) {
      pathHasLocalized = true
      localizedPath = `${localizedPath}.<locale>`
    }

    if ('flattenedFields' in field) {
      currentFields = field.flattenedFields
    }

    if (
      config &&
      includeRelationships &&
      (field.type === 'relationship' || field.type === 'upload') &&
      !Array.isArray(field.relationTo)
    ) {
      const flattenedFields = config.collections.find(
        (e) => e.slug === field.relationTo,
      )?.flattenedFields
      if (flattenedFields) {
        currentFields = flattenedFields
      }

      if (segments.length === 1 && segments[0] === 'id') {
        return { field, localizedPath, pathHasLocalized }
      }
    }

    if ('blocks' in field) {
      for (const block of field.blocks) {
        const maybeField = getFieldByPath({
          config,
          fields: block.flattenedFields,
          includeRelationships,
          localizedPath,
          path: [...segments].join('.'),
        })

        if (maybeField) {
          return maybeField
        }
      }
    }

    currentField = field
  }

  if (!currentField) {
    return null
  }

  return { field: currentField, localizedPath, pathHasLocalized }
}
