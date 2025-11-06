import type { RelationshipField, UploadField } from 'payload'

import toSnakeCase from 'to-snake-case'

import type { TransformArgs } from './index.js'

import { transform } from './index.js'

type Args = {
  field: RelationshipField | UploadField
  locale?: string
  ref: Record<string, unknown>
  relations: Record<string, unknown>[]
  withinArrayOrBlockLocale?: string
} & TransformArgsRecurve

type ArgsRecursive = {
  data: unknown
  relationTo: string
} & TransformArgsRecurve

type TransformArgsRecurve = Pick<
  TransformArgs,
  'adapter' | 'config' | 'joinQuery' | 'parentIsLocalized'
>

export const transformRelationship = ({
  field,
  locale,
  ref,
  relations,
  withinArrayOrBlockLocale,
  ...args
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
            value: transformRecursive({
              ...args,
              data: matchedRelation[1],
              relationTo,
            }),
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
        const relationTo = field.relationTo

        if (relatedData && matchedLocale) {
          transformedRelations.push(
            transformRecursive({
              ...args,
              data: relatedData,
              relationTo,
            }),
          )
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
            value: transformRecursive({
              ...args,
              data: matchedRelation[1],
              relationTo,
            }),
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

const transformRecursive = ({
  adapter,
  config,
  data,
  joinQuery,
  parentIsLocalized,
  relationTo,
}: ArgsRecursive) => {
  if (typeof data !== 'object') {
    return data
  }

  const relationshipConfig = adapter.payload.collections[relationTo].config
  const relationshipTableName = toSnakeCase(relationTo)

  return transform({
    adapter,
    config,
    data: data as Record<string, unknown>,
    fields: relationshipConfig.flattenedFields,
    joinQuery,
    parentIsLocalized,
    tableName: relationshipTableName,
  })
}
