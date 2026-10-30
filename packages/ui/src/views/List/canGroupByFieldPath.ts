import type { FlattenedField } from 'payload'

type GetRelatedFields = (collectionSlug: string) => FlattenedField[] | undefined

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
 *
 * A virtual field linked to a path (`virtual: 'category.links.label'`) is grouped by that path,
 * which `findDistinct` resolves from the root of the field's collection, so the walk checks the
 * target path the same way. Virtual fields that link to each other in a cycle are rejected, and so
 * are virtual fields not linked to a path (`virtual: true`), which `findDistinct` cannot query.
 *
 * A path naming a field that does not exist (for example one removed from the config since the
 * preference was saved) is rejected too, since `findDistinct` would fail on it. The one exception is
 * `id` right after a relationship (`category.id`), which `findDistinct` accepts.
 */
export const canGroupByFieldPath = ({
  fields,
  getRelatedFields,
  path,
}: {
  fields: FlattenedField[]
  getRelatedFields?: GetRelatedFields
  path: string
}): boolean =>
  canGroupByPath({
    fields,
    getRelatedFields,
    path: path.replace(/^-/, ''),
    visitedVirtualFields: new Set(),
  })

const canGroupByPath = ({
  fields,
  getRelatedFields,
  path,
  visitedVirtualFields,
}: {
  fields: FlattenedField[]
  getRelatedFields?: GetRelatedFields
  path: string
  visitedVirtualFields: Set<FlattenedField>
}): boolean => {
  // Virtual paths resolve from the root of the collection the virtual field belongs to.
  let collectionFields: FlattenedField[] = fields
  let currentFields: FlattenedField[] | undefined = fields

  const segments = path.split('.')

  let previousField: FlattenedField | undefined

  for (const [index, segment] of segments.entries()) {
    // Fields of a related collection the caller cannot look up: nothing more to check.
    if (!currentFields) {
      return true
    }

    const field: FlattenedField | undefined = currentFields.find((each) => each.name === segment)

    if (!field) {
      return (
        segment === 'id' &&
        index === segments.length - 1 &&
        (previousField?.type === 'relationship' || previousField?.type === 'upload')
      )
    }

    previousField = field

    if ('virtual' in field && field.virtual === true) {
      return false
    }

    if ('virtual' in field && typeof field.virtual === 'string') {
      if (visitedVirtualFields.has(field)) {
        return false
      }

      visitedVirtualFields.add(field)

      return canGroupByPath({
        fields: collectionFields,
        getRelatedFields,
        path: [field.virtual, ...segments.slice(index + 1)].join('.'),
        visitedVirtualFields,
      })
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

      if (currentFields) {
        collectionFields = currentFields
      }

      continue
    }

    currentFields = 'flattenedFields' in field ? field.flattenedFields : undefined
  }

  return true
}
