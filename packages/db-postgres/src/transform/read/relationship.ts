/* eslint-disable no-param-reassign */
import type { RelationshipField, UploadField } from 'payload/types'

type Args = {
  field: RelationshipField | UploadField
  locale?: string
  ref: Record<string, unknown>
  relations: Record<string, unknown>[]
}

export const transformRelationship = ({ field, locale, ref, relations }: Args) => {
  let result: unknown

  if (!('hasMany' in field) || field.hasMany === false) {
    const relation = relations[0]

    if (relation) {
      // Handle hasOne Poly
      if (Array.isArray(field.relationTo)) {
        const matchedRelation = Object.entries(relation).find(
          ([key, val]) =>
            val !== null && !['id', 'locale', 'order', 'parent', 'path'].includes(key),
        )

        if (matchedRelation) {
          const relationTo = matchedRelation[0].replace('ID', '')

          result = {
            relationTo,
            value: matchedRelation[1],
          }
        }
      } else {
        // Handle hasOne
        const relatedData = relation[`${field.relationTo}ID`]
        result = relatedData
      }
    }
  } else {
    const transformedRelations = []

    relations.forEach((relation) => {
      // Handle hasMany
      if (!Array.isArray(field.relationTo)) {
        const relatedData = relation[`${field.relationTo}ID`]

        if (relatedData) {
          transformedRelations.push(relatedData)
        }
      } else {
        // Handle hasMany Poly
        const matchedRelation = Object.entries(relation).find(
          ([key, val]) =>
            val !== null && !['id', 'locale', 'order', 'parent', 'path'].includes(key),
        )

        if (matchedRelation) {
          const relationTo = matchedRelation[0].replace('ID', '')

          transformedRelations.push({
            relationTo,
            value: matchedRelation[1],
          })
        }
      }
    })

    result = transformedRelations
  }

  if (locale) {
    ref[field.name][locale] = result
  } else {
    ref[field.name] = result
  }
}
