/* eslint-disable no-param-reassign */
import * as GraphQL from 'graphql';
import { GraphQLObjectType, GraphQLSchema } from 'graphql';
import queryComplexity, { fieldExtensionsEstimator, simpleEstimator } from 'graphql-query-complexity';
import { Payload } from '../payload';
import buildLocaleInputType from './schema/buildLocaleInputType';
import buildFallbackLocaleInputType from './schema/buildFallbackLocaleInputType';
import initCollections from '../collections/graphql/init';
import initGlobals from '../globals/graphql/init';
import initPreferences from '../preferences/graphql/init';
import buildPoliciesType from './schema/buildPoliciesType';
import accessResolver from '../auth/graphql/resolvers/access';

export default function registerSchema(payload: Payload): void {
  payload.types = {
    blockTypes: {},
    blockInputTypes: {},
    groupTypes: {},
    arrayTypes: {},
    tabTypes: {},
  };

  if (payload.config.localization) {
    payload.types.localeInputType = buildLocaleInputType(payload.config.localization);
    payload.types.fallbackLocaleInputType = buildFallbackLocaleInputType(payload.config.localization);
  }

  payload.Query = {
    name: 'Query',
    fields: {},
  };

  payload.Mutation = {
    name: 'Mutation',
    fields: {},
  };

  initCollections(payload);
  initGlobals(payload);
  initPreferences(payload);

  payload.Query.fields.Access = {
    type: buildPoliciesType(payload),
    resolve: accessResolver(payload),
  };

  if (typeof payload.config.graphQL.queries === 'function') {
    const customQueries = payload.config.graphQL.queries(GraphQL, payload);
    payload.Query = {
      ...payload.Query,
      fields: {
        ...payload.Query.fields,
        ...(customQueries || {}),
      },
    };
  }

  if (typeof payload.config.graphQL.mutations === 'function') {
    const customMutations = payload.config.graphQL.mutations(GraphQL, payload);
    payload.Mutation = {
      ...payload.Mutation,
      fields: {
        ...payload.Mutation.fields,
        ...(customMutations || {}),
      },
    };
  }

  const query = new GraphQLObjectType(payload.Query);
  const mutation = new GraphQLObjectType(payload.Mutation);

  const schema = {
    query,
    mutation,
  };

  payload.schema = new GraphQLSchema(schema);

  payload.validationRules = ({ variableValues }) => ([
    queryComplexity({
      estimators: [
        fieldExtensionsEstimator(),
        simpleEstimator({ defaultComplexity: 1 }), // Fallback if complexity not set
      ],
      maximumComplexity: payload.config.graphQL.maxComplexity,
      variables: variableValues,
      // onComplete: (complexity) => { console.log('Query Complexity:', complexity); },
    }),
  ]);
}
