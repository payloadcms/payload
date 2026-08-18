import type { FlattenedField } from '../fields/config/types.js'
import type { Payload, Where } from '../types/index.js'

import { hasManyRelationshipOperators } from '../types/constants.js'

/**
 * Replaces virtual field names in a `where` query with the database paths they point to.
 */
export const sanitizeWhereQuery = ({
  fields,
  payload,
  where,
}: {
  fields: FlattenedField[]
  payload: Payload
  where: Where
}) => {
  for (const key in where) {
    const value = where[key]

    if (['and', 'or'].includes(key.toLowerCase()) && Array.isArray(value)) {
      for (const where of value) {
        sanitizeWhereQuery({ fields, payload, where })
      }
      continue
    }

    const paths = key.split('.')
    let pathHasChanged = false

    let currentFields = fields
    let finalField: FlattenedField | undefined

    for (let i = 0; i < paths.length; i++) {
      const path = paths[i]!
      const field = currentFields.find((each) => each.name === path)

      if (!field) {
        break
      }

      finalField = field

      if ('virtual' in field && field.virtual && typeof field.virtual === 'string') {
        paths[i] = field.virtual
        pathHasChanged = true
      }

      if ('flattenedFields' in field) {
        currentFields = field.flattenedFields
      }

      if (
        (field.type === 'relationship' || field.type === 'upload') &&
        typeof field.relationTo === 'string'
      ) {
        const relatedCollection = payload.collections[field.relationTo]
        if (relatedCollection) {
          currentFields = relatedCollection.config.flattenedFields
        }
      }
    }

    // Follow relationship fields so virtual fields on related documents are also resolved.
    sanitizeNestedHasManyRelationshipQueries({ field: finalField, payload, value })

    if (pathHasChanged) {
      where[paths.join('.')] = where[key]!
      delete where[key]
    }
  }
}

/**
 * Resolves virtual field paths inside the nested query accepted by `some`, `none`, and `every`.
 * The nested query uses fields from the related collection, not fields from the parent collection.
 *
 * @example
 * ```ts
 * {
 *   movies: {
 *     some: {
 *       displayTitle: { equals: 'Alien' }, // `displayTitle` may point to a virtual field path
 *     },
 *   },
 * }
 * ```
 */
function sanitizeNestedHasManyRelationshipQueries({
  field,
  payload,
  value,
}: {
  field?: FlattenedField
  payload: Payload
  value: unknown
}): void {
  if (
    !field ||
    (field.type !== 'relationship' && field.type !== 'upload') ||
    !field.hasMany ||
    typeof field.relationTo !== 'string' ||
    value === null ||
    typeof value !== 'object' ||
    Array.isArray(value)
  ) {
    return
  }

  const relatedFields = payload.collections[field.relationTo]?.config.flattenedFields
  if (!relatedFields) {
    return
  }

  for (const operator of hasManyRelationshipOperators) {
    const nestedWhere = (value as Record<string, unknown>)[operator]

    if (nestedWhere && typeof nestedWhere === 'object' && !Array.isArray(nestedWhere)) {
      sanitizeWhereQuery({ fields: relatedFields, payload, where: nestedWhere as Where })
    }
  }
}
