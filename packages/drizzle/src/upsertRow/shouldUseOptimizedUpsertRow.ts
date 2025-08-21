import type { FlattenedField } from 'payload'

/**
 * Checks whether we should use the upsertRow function for the passed data and otherwise use a simple SQL SET call.
 * We need to use upsertRow only when the data has arrays, blocks, hasMany select/text/number, localized fields, complex relationships.
 */
export const shouldUseOptimizedUpsertRow = ({
  data,
  fields,
}: {
  data: Record<string, unknown>
  fields: FlattenedField[]
}) => {
  for (const key in data) {
    const value = data[key]
    const field = fields.find((each) => each.name === key)

    if (!field) {
      continue
    }

    if (
      field.type === 'array' ||
      field.type === 'blocks' ||
      ((field.type === 'text' ||
        field.type === 'relationship' ||
        field.type === 'upload' ||
        field.type === 'select' ||
        field.type === 'number') &&
        field.hasMany) ||
      ((field.type === 'relationship' || field.type === 'upload') &&
        Array.isArray(field.relationTo)) ||
      field.localized
    ) {
      return false
    }

    if (
      (field.type === 'group' || field.type === 'tab') &&
      value &&
      typeof value === 'object' &&
      !shouldUseOptimizedUpsertRow({
        data: value as Record<string, unknown>,
        fields: field.flattenedFields,
      })
    ) {
      return false
    }
  }

  return true
}
