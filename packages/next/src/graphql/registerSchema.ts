/* eslint-disable no-param-reassign */
import * as GraphQL from 'graphql'
import { GraphQLObjectType, GraphQLSchema } from 'graphql'
import queryComplexity, {
  fieldExtensionsEstimator,
  simpleEstimator,
} from 'graphql-query-complexity'

import type { Payload } from 'payload'

import accessResolver from './resolvers/auth/access'
import initCollections from './initCollections'
import initGlobals from './initGlobals'
import buildFallbackLocaleInputType from './schema/buildFallbackLocaleInputType'
import buildLocaleInputType from './schema/buildLocaleInputType'
import buildPoliciesType from './schema/buildPoliciesType'
import { wrapCustomFields } from './utilities/wrapCustomResolver'

function register(payload: Payload): void {
  payload.types = {
    arrayTypes: {},
    blockInputTypes: {},
    blockTypes: {},
    groupTypes: {},
    tabTypes: {},
  }

  if (payload.config.localization) {
    payload.types.localeInputType = buildLocaleInputType(payload.config.localization)
    payload.types.fallbackLocaleInputType = buildFallbackLocaleInputType(
      payload.config.localization,
    )
  }

  payload.Query = {
    name: 'Query',
    fields: {},
  }

  payload.Mutation = {
    name: 'Mutation',
    fields: {},
  }

  initCollections(payload)
  initGlobals(payload)

  payload.Query.fields.Access = {
    resolve: accessResolver(payload),
    type: buildPoliciesType(payload),
  }

  if (typeof payload.config.graphQL.queries === 'function') {
    const customQueries = payload.config.graphQL.queries(GraphQL, payload)
    payload.Query = {
      ...payload.Query,
      fields: {
        ...payload.Query.fields,
        ...wrapCustomFields((customQueries || {}) as never),
      },
    }
  }

  if (typeof payload.config.graphQL.mutations === 'function') {
    const customMutations = payload.config.graphQL.mutations(GraphQL, payload)
    payload.Mutation = {
      ...payload.Mutation,
      fields: {
        ...payload.Mutation.fields,
        ...wrapCustomFields((customMutations || {}) as never),
      },
    }
  }

  const query = new GraphQLObjectType(payload.Query)
  const mutation = new GraphQLObjectType(payload.Mutation)

  const schema = {
    mutation,
    query,
  }

  payload.schema = new GraphQLSchema(schema)

  payload.validationRules = ({ variableValues }) => [
    queryComplexity({
      estimators: [
        fieldExtensionsEstimator(),
        simpleEstimator({ defaultComplexity: 1 }), // Fallback if complexity not set
      ],
      maximumComplexity: payload.config.graphQL.maxComplexity,
      variables: variableValues,
      // onComplete: (complexity) => { console.log('Query Complexity:', complexity); },
    }),
  ]
}

let cached = global._payload_graphql

if (!cached) {
  // eslint-disable-next-line no-multi-assign
  cached = global._payload_graphql = { schemaGenerated: false }
}

export const registerGraphQLSchema = (payload: Payload): void => {
  if (cached.schemaGenerated) {
    return
  }

  register(payload)

  cached.schemaGenerated = true
}
