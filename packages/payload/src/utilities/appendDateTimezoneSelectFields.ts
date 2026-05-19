import type { FlattenedField } from '../fields/config/types.js'
import type { SelectType } from '../types/index.js'

/**
 * Mutates the incoming select object to append `{name}_tz` siblings for any date
 * field with `timezone` enabled that has been requested in the select. Without
 * this, the List View's Select API would omit the timezone sibling and
 * cells would render dates in the server's timezone.
 */
export const appendDateTimezoneSelectFields = ({
  fields,
  select,
}: {
  fields: FlattenedField[]
  select: SelectType
}) => {
  if (!select) {
    return
  }

  for (const field of fields) {
    if (!('name' in field)) {
      continue
    }

    const value = select[field.name]

    if (field.type === 'date' && field.timezone && value) {
      select[`${field.name}_tz`] = true
      continue
    }

    if (!value || typeof value !== 'object') {
      continue
    }

    if ('flattenedFields' in field) {
      appendDateTimezoneSelectFields({
        fields: field.flattenedFields,
        select: value as SelectType,
      })
      continue
    }

    if (field.type === 'blocks') {
      const blockReferences = (field.blockReferences ?? field.blocks) as Array<
        | {
            flattenedFields: FlattenedField[]
            slug: string
          }
        | string
      >

      for (const block of blockReferences) {
        if (typeof block === 'string') {
          continue
        }
        const blockSelect = (value as SelectType)[block.slug]
        if (blockSelect && typeof blockSelect === 'object') {
          appendDateTimezoneSelectFields({
            fields: block.flattenedFields,
            select: blockSelect as SelectType,
          })
        }
      }
    }
  }
}
