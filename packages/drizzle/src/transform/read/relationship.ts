import type { RelationshipField, UploadField } from 'payload'

type Args = {
  field: RelationshipField | UploadField
  locale?: string
  ref: Record<string, unknown>
  relations: Record<string, unknown>[]
  withinArrayOrBlockLocale?: string
}

export const transformRelationship = ({
  field,
  locale,
  ref,
  relations,
  withinArrayOrBlockLocale,
}: Args) => {
  let result: unknown

  if (!('hasMany' in field) || field.hasMany === false) {
    let relation = relations[0]

    if (withinArrayOrBlockLocale) {
      relation = relations.find((rel) => rel.locale === withinArrayOrBlockLocale)
    }

    if (relation) {
      // Handle hasOne Poly
      if (Array.isArray(field.relationTo)) {
        const matchedRelation = Object.entries(relation).find(([key, val]) => {
          return val !== null && !['id', 'locale', 'order', 'parent', 'path'].includes(key)
        })

        if (matchedRelation) {
          const relationTo = matchedRelation[0].replace('ID', '')

          result = {
            relationTo,
            value: matchedRelation[1],
          }
        }
      }
    }
  } else {
    const transformedRelations = []

    relations.forEach((relation) => {
      let matchedLocale = true

      if (withinArrayOrBlockLocale) {
        matchedLocale = relation.locale === withinArrayOrBlockLocale
      }

      // Handle hasMany
      if (!Array.isArray(field.relationTo)) {
        const relatedData = relation[`${field.relationTo}ID`]

        if (relatedData && matchedLocale) {
          transformedRelations.push(relatedData)
        }
      } else {
        // Handle hasMany Poly
        const matchedRelation = Object.entries(relation).find(
          ([key, val]) =>
            val !== null &&
            !['id', 'locale', 'order', 'parent', 'path'].includes(key) &&
            matchedLocale,
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
