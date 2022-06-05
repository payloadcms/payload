import * as GraphQL from 'graphql';
import { GraphQLObjectType, GraphQLSchema } from 'graphql';
import { graphqlHTTP } from 'express-graphql';
import queryComplexity, { fieldExtensionsEstimator, simpleEstimator } from 'graphql-query-complexity';
import errorHandler from './errorHandler';
import buildPoliciesType from './schema/buildPoliciesType';
import buildLocaleInputType from './schema/buildLocaleInputType';
import buildFallbackLocaleInputType from './schema/buildFallbackLocaleInputType';
import initCollections from '../collections/graphql/init';
import initGlobals from '../globals/graphql/init';
import initPreferences from '../preferences/graphql/init';
import accessResolver from '../auth/graphql/resolvers/access';

const initializeGraphQL = (req, res) => {
  const { payload } = req;

  payload.types = {
    blockTypes: {},
    blockInputTypes: {},
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
    resolve: accessResolver,
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

  payload.extensions = async (info) => {
    const { result } = info;
    if (result.errors) {
      payload.errorIndex = 0;
      const afterErrorHook = typeof payload.config.hooks.afterError === 'function' ? payload.config.hooks.afterError : null;
      payload.errorResponses = await errorHandler(info, payload.config.debug, afterErrorHook);
    }
    return null;
  };

  payload.customFormatErrorFn = (error) => {
    if (payload.errorResponses && payload.errorResponses[payload.errorIndex]) {
      const response = payload.errorResponses[payload.errorIndex];
      payload.errorIndex += 1;
      return response;
    }

    return error;
  };

  payload.validationRules = (variables) => ([
    queryComplexity({
      estimators: [
        fieldExtensionsEstimator(),
        simpleEstimator({ defaultComplexity: 1 }), // Fallback if complexity not set
      ],
      maximumComplexity: payload.config.graphQL.maxComplexity,
      variables,
      // onComplete: (complexity) => { console.log('Query Complexity:', complexity); },
    }),
  ]);

  payload.errorResponses = null;

  return graphqlHTTP(
    async (request, response, { variables }) => ({
      schema: payload.schema,
      customFormatErrorFn: payload.customFormatErrorFn,
      extensions: payload.extensions,
      context: { req, res },
      validationRules: payload.validationRules(variables),
    }),
  );
};

export default initializeGraphQL;
