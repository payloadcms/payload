import type { FlattenedField } from '../fields/config/types.js'
import type { Payload, Where } from '../types/index.js'

/**
 * Currently used only for virtual fields linked with relationships
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

    for (let i = 0; i < paths.length; i++) {
      const path = paths[i]!
      const field = currentFields.find((each) => each.name === path)

      if (!field) {
        break
      }

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

    if (pathHasChanged) {
      where[paths.join('.')] = where[key]!
      delete where[key]
    }
  }
}
