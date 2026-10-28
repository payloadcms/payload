import type { FlattenedField } from 'payload'

/**
 * Whether the list view can group documents by the field at `path`.
 *
 * A field inside an array or blocks field has one value per row, so a document holds many values
 * for it: `findDistinct` returns arrays, which cannot be used as a group's `equals` query. The group-by
 * popup does not offer such fields, but the path can still arrive through the URL or saved
 * preferences, so the list view ignores it instead of failing to render.
 *
 * A path can also run through a relationship or upload field into the related collection
 * (`category.links.label`), so `getRelatedFields` lets the walk continue there.
 */
export const canGroupByFieldPath = ({
  fields,
  getRelatedFields,
  path,
}: {
  fields: FlattenedField[]
  getRelatedFields?: (collectionSlug: string) => FlattenedField[] | undefined
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

    if (field.type === 'relationship' || field.type === 'upload') {
      currentFields =
        typeof field.relationTo === 'string' ? getRelatedFields?.(field.relationTo) : undefined
      continue
    }

    currentFields = 'flattenedFields' in field ? field.flattenedFields : undefined
  }

  return true
}
