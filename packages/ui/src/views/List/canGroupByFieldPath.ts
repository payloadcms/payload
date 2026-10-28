import type { FlattenedField } from 'payload'

/**
 * Whether the list view can group documents by the field at `path`.
 *
 * A field inside an array or blocks field has one value per row, so a document holds many values
 * for it: `findDistinct` returns arrays, which cannot be used as a group's `equals` query. The group-by
 * popup does not offer such fields, but the path can still arrive through the URL or saved
 * preferences, so the list view ignores it instead of failing to render.
 */
export const canGroupByFieldPath = ({
  fields,
  path,
}: {
  fields: FlattenedField[]
  path: string
}): boolean => {
  let currentFields: FlattenedField[] | undefined = fields

  for (const segment of path.replace(/^-/, '').split('.')) {
    const field: FlattenedField | undefined = currentFields?.find((each) => each.name === segment)

    if (!field) {
      return true
    }

    if (field.type === 'array' || field.type === 'blocks') {
      return false
    }

    currentFields = 'flattenedFields' in field ? field.flattenedFields : undefined
  }

  return true
}
