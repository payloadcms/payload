/* eslint-disable no-param-reassign */
import * as GraphQL from 'graphql'
import { GraphQLObjectType, GraphQLSchema, GraphQLEnumType, GraphQLNonNull } from 'graphql'
import type { GraphQLScalarType, ValidationRule } from 'graphql'

import queryComplexity, {
  fieldExtensionsEstimator,
  simpleEstimator,
} from 'graphql-query-complexity'

import accessResolver from '../resolvers/auth/access'
import initCollections from '../initCollections'
import initGlobals from '../initGlobals'
import buildFallbackLocaleInputType from './buildFallbackLocaleInputType'
import buildLocaleInputType from './buildLocaleInputType'
import buildPoliciesType from './buildPoliciesType'
import { wrapCustomFields } from '../utilities/wrapCustomResolver'
import { Collection, SanitizedConfig, SanitizedGlobalConfig } from 'payload/types'
import { OperationArgs } from 'graphql-http'

/*
 * Actually Need:
 * - config
 * - db
 * - collections
 * - types
 * - Query
 * - Mutation
 */

export type Result = {
  types: {
    arrayTypes: Record<string, GraphQL.GraphQLType>
    blockInputTypes: Record<string, GraphQL.GraphQLInputObjectType>
    blockTypes: Record<string, GraphQL.GraphQLObjectType>
    groupTypes: Record<string, GraphQL.GraphQLObjectType>
    tabTypes: Record<string, GraphQL.GraphQLObjectType>
    localeInputType?: GraphQLEnumType | GraphQLScalarType
    fallbackLocaleInputType?: GraphQLEnumType | GraphQLScalarType
  }
  Query: {
    name: string
    fields: Record<string, any>
  }
  Mutation: {
    name: string
    fields: Record<string, any>
  }
  collections: {
    [slug: number | string | symbol]: Collection
  }
  globals: {
    config: SanitizedGlobalConfig[]
    graphQL?:
      | {
          [slug: string]: {
            mutationInputType: GraphQLNonNull<any>
            type: GraphQLObjectType
            versionType?: GraphQLObjectType
          }
        }
      | false
  }
  defaultIDType: 'text' | 'number'
}

export async function configToSchema(config: SanitizedConfig): Promise<{
  schema: GraphQLSchema
  validationRules: (args: OperationArgs<any>) => ValidationRule[]
}> {
  const collections = config.collections.reduce((acc, collection) => {
    acc[collection.slug] = {
      config: collection,
    }

    return acc
  }, {})

  const globals = {
    config: config.globals,
  }

  let graphqlResult: Result = {
    types: {
      arrayTypes: {},
      blockInputTypes: {},
      blockTypes: {},
      groupTypes: {},
      tabTypes: {},
    },
    Query: {
      name: 'Query',
      fields: {},
    },
    Mutation: {
      name: 'Mutation',
      fields: {},
    },
    collections,
    globals,
    // TODO: This needs to be determined by the db adapter
    defaultIDType: 'text',
  }

  if (config.localization) {
    graphqlResult.types['localeInputType'] = buildLocaleInputType(config.localization)
    graphqlResult.types['fallbackLocaleInputType'] = buildFallbackLocaleInputType(
      config.localization,
    )
  }

  initCollections({ config, graphqlResult })
  initGlobals({ config, graphqlResult })

  graphqlResult.Query.fields['Access'] = {
    resolve: accessResolver(config),
    type: buildPoliciesType(config),
  }

  if (typeof config.graphQL.queries === 'function') {
    const customQueries = config.graphQL.queries(GraphQL, config)
    graphqlResult.Query = {
      ...graphqlResult.Query,
      fields: {
        ...graphqlResult.Query.fields,
        ...wrapCustomFields((customQueries || {}) as never),
      },
    }
  }

  if (typeof config.graphQL.mutations === 'function') {
    const customMutations = config.graphQL.mutations(GraphQL, config)
    graphqlResult.Mutation = {
      ...graphqlResult.Mutation,
      fields: {
        ...graphqlResult.Mutation.fields,
        ...wrapCustomFields((customMutations || {}) as never),
      },
    }
  }

  const query = new GraphQLObjectType(graphqlResult.Query)
  const mutation = new GraphQLObjectType(graphqlResult.Mutation)

  const schemaToCreate = {
    mutation,
    query,
  }

  const schema = new GraphQLSchema(schemaToCreate)

  const validationRules = ({ variableValues }) => [
    queryComplexity({
      estimators: [
        fieldExtensionsEstimator(),
        simpleEstimator({ defaultComplexity: 1 }), // Fallback if complexity not set
      ],
      maximumComplexity: config.graphQL.maxComplexity,
      variables: variableValues,
      // onComplete: (complexity) => { console.log('Query Complexity:', complexity); },
    }),
  ]

  return {
    schema,
    validationRules,
  }
}
