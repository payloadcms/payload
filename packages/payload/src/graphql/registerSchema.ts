/* eslint-disable no-param-reassign */
import * as GraphQL from 'graphql'
import { GraphQLObjectType, GraphQLSchema } from 'graphql'
import queryComplexity, {
  fieldExtensionsEstimator,
  simpleEstimator,
} from 'graphql-query-complexity'

import type { Payload } from '../payload'

import accessResolver from '../auth/graphql/resolvers/access'
import initCollections from '../collections/graphql/init'
import initGlobals from '../globals/graphql/init'
import buildFallbackLocaleInputType from './schema/buildFallbackLocaleInputType'
import buildLocaleInputType from './schema/buildLocaleInputType'
import buildPoliciesType from './schema/buildPoliciesType'
import { wrapCustomFields } from './utilities/wrapCustomResolver'

export default function registerGraphQLSchema(payload: Payload): void {
  payload.types = {
    arrayTypes: {},
    blockInputTypes: {},
    blockTypes: {},
    groupTypes: {},
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
