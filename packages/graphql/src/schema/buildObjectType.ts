import type { GraphQLFieldConfig } from 'graphql'
import type { Field, GraphQLInfo, SanitizedConfig } from 'payload'

import { GraphQLObjectType } from 'graphql'

import { fieldToSchemaMap } from './fieldToSchemaMap.js'

export type ObjectTypeConfig = {
  [path: string]: GraphQLFieldConfig<any, any, any>
}

type Args = {
  baseFields?: ObjectTypeConfig
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
  config,
  fields,
  forceNullable,
  graphqlResult,
  parentIsLocalized,
  parentName,
}: Args): GraphQLObjectType {
  const objectSchema = {
    name,
    fields: () =>
      fields.reduce((objectTypeConfig, field) => {
        const fieldSchema = fieldToSchemaMap[field.type]

        if (typeof fieldSchema !== 'function') {
          return objectTypeConfig
        }

        return {
          ...objectTypeConfig,
          ...fieldSchema({
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
      }, baseFields),
  }

  const newlyCreatedBlockType = new GraphQLObjectType(objectSchema)

  return newlyCreatedBlockType
}
