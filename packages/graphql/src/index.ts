/* eslint-disable no-param-reassign */
import * as GraphQL from 'graphql'
import { OperationArgs } from 'graphql-http'

import {
  fieldExtensionsEstimator,
  simpleEstimator,
  createComplexityRule,
} from 'graphql-query-complexity'

import type { GraphQLInfo } from 'payload/config'
import type { SanitizedConfig } from 'payload/types'
import accessResolver from './resolvers/auth/access'
import initCollections from './schema/initCollections'
import initGlobals from './schema/initGlobals'
import buildFallbackLocaleInputType from './schema/buildFallbackLocaleInputType'
import buildLocaleInputType from './schema/buildLocaleInputType'
import buildPoliciesType from './schema/buildPoliciesType'
import { wrapCustomFields } from './utilities/wrapCustomResolver'

export async function configToSchema(config: SanitizedConfig): Promise<{
  schema: GraphQL.GraphQLSchema
  validationRules: (args: OperationArgs<any>) => GraphQL.ValidationRule[]
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

  let graphqlResult: GraphQLInfo = {
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
    const customQueries = config.graphQL.queries(GraphQL, {
      ...graphqlResult,
      config,
    })
    graphqlResult.Query = {
      ...graphqlResult.Query,
      fields: {
        ...graphqlResult.Query.fields,
        ...wrapCustomFields((customQueries || {}) as never),
      },
    }
  }

  if (typeof config.graphQL.mutations === 'function') {
    const customMutations = config.graphQL.mutations(GraphQL, {
      ...graphqlResult,
      config,
    })
    graphqlResult.Mutation = {
      ...graphqlResult.Mutation,
      fields: {
        ...graphqlResult.Mutation.fields,
        ...wrapCustomFields((customMutations || {}) as never),
      },
    }
  }

  const query = new GraphQL.GraphQLObjectType(graphqlResult.Query)
  const mutation = new GraphQL.GraphQLObjectType(graphqlResult.Mutation)

  const schemaToCreate = {
    mutation,
    query,
  }

  const schema = new GraphQL.GraphQLSchema(schemaToCreate)

  const validationRules = (args) => [
    createComplexityRule({
      estimators: [
        fieldExtensionsEstimator(),
        simpleEstimator({ defaultComplexity: 1 }), // Fallback if complexity not set
      ],
      maximumComplexity: config.graphQL.maxComplexity,
      variables: args.variableValues,
      // onComplete: (complexity) => { console.log('Query Complexity:', complexity); },
    }),
  ]

  return {
    schema,
    validationRules,
  }
}
