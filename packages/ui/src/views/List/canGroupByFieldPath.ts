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
 * (`category.links.label`), so `getRelatedFields` lets the walk continue there. A path that goes
 * on past a polymorphic relationship is rejected: its target collection is not known.
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

  const segments = path.replace(/^-/, '').split('.')

  for (const [index, segment] of segments.entries()) {
    const field: FlattenedField | undefined = currentFields?.find((each) => each.name === segment)

    if (!field) {
      return true
    }

    if (field.type === 'array' || field.type === 'blocks') {
      return false
    }

    if (field.type === 'relationship' || field.type === 'upload') {
      // A polymorphic relationship can be grouped by itself, but the field after it depends on
      // the related document's collection, which the query cannot resolve.
      if (typeof field.relationTo !== 'string') {
        return index === segments.length - 1
      }

      currentFields = getRelatedFields?.(field.relationTo)
      continue
    }

    currentFields = 'flattenedFields' in field ? field.flattenedFields : undefined
  }

  return true
}
