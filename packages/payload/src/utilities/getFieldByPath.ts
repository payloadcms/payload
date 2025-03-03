import type { FlattenedField } from '../fields/config/types.js'

/**
 * Get a field from the by its path.
 * Can accept nested paths, e.g: group.title, array.group.title
 */
export const getFieldByPath = ({
  fields,
  path,
}: {
  fields: FlattenedField[]
  path: string
}): FlattenedField | null => {
  let currentFields: FlattenedField[] = fields

  let currentField: FlattenedField | null = null

  const segments = path.split('.')

  for (let i = 0; i < segments.length; i++) {
    const segment = segments.shift()
    const field = currentFields.find((each) => each.name === segment)

    if (!field) {
      return null
    }

    if ('flattenedFields' in field) {
      currentFields = field.flattenedFields
    }

    if ('blocks' in field) {
      for (const block of field.blocks) {
        const maybeField = getFieldByPath({
          fields: block.flattenedFields,
          path: [...segments].join('.'),
        })

        if (maybeField) {
          return maybeField
        }
      }
    }

    currentField = field
  }

  return currentField
}
