import type { GraphQLFieldConfig } from 'graphql'
import type { Field, GraphQLInfo, SanitizedConfig } from 'payload'

import { getNamedType, GraphQLObjectType, isLeafType } from 'graphql'
import { flattenTopLevelFields, toWords } from 'payload'
import { fieldAffectsData } from 'payload/shared'

import { GraphQLJSON } from '../packages/graphql-type-json/index.js'
import { formatName } from '../utilities/formatName.js'
import { buildLocalizedOutputType } from './buildLocalizedOutputType.js'
import { fieldToSchemaMap } from './fieldToSchemaMap.js'

export type ObjectTypeConfig = {
  [path: string]: GraphQLFieldConfig<any, any, any>
}

type Args = {
  baseFields?: ObjectTypeConfig
  collectionSlug?: string
  config: SanitizedConfig
  fields: Field[]
  forceNullable?: boolean
  graphqlResult: GraphQLInfo
  name: string
  parentIsLocalized?: boolean
  parentName: string
}

export function buildObjectType({
  name,
  baseFields = {},
  collectionSlug,
  config,
  fields,
  forceNullable,
  graphqlResult,
  parentIsLocalized,
  parentName,
}: Args): GraphQLObjectType {
  const objectSchema = {
    name,
    fields: () => {
      const objectTypeConfig = fields.reduce(
        (objectTypeConfig, field) => {
          const fieldSchema = fieldToSchemaMap[field.type]

          if (typeof fieldSchema !== 'function') {
            return objectTypeConfig
          }

          return {
            ...objectTypeConfig,
            ...fieldSchema({
              collectionSlug,
              config,
              field,
              forceNullable,
              graphqlResult,
              newlyCreatedBlockType,
              objectTypeConfig,
              parentIsLocalized,
              parentName,
            }),
          }
        },
        { ...baseFields },
      )

      if (config.localization && !parentIsLocalized) {
        for (const field of flattenTopLevelFields(fields)) {
          if (!fieldAffectsData(field) || !field.localized) {
            continue
          }

          const fieldName = formatName(field.name)
          const fieldSchema = objectTypeConfig[fieldName]

          if (!fieldSchema) {
            continue
          }

          if (isLeafType(getNamedType(fieldSchema.type))) {
            fieldSchema.type = buildLocalizedOutputType({
              name: `${formatName(name)}${toWords(field.name, true)}LocalizedValue`,
              type: fieldSchema.type,
              localeCodes: config.localization.localeCodes,
            })
          } else {
            objectTypeConfig[`${fieldName}_locales`] = {
              type: GraphQLJSON,
              description:
                'The complete locale map for this field when the parent query uses locale: all.',
              extensions: { ...fieldSchema.extensions, field },
              resolve: (parent) => parent[field.name],
            }
          }
        }
      }

      return objectTypeConfig
    },
  }

  const newlyCreatedBlockType = new GraphQLObjectType(objectSchema)

  return newlyCreatedBlockType
}
