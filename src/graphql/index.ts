import * as GraphQL from 'graphql';
import { GraphQLError, GraphQLFormattedError, GraphQLObjectType, GraphQLSchema } from 'graphql';
import { graphqlHTTP } from 'express-graphql';
import queryComplexity, { fieldExtensionsEstimator, simpleEstimator } from 'graphql-query-complexity';
import buildObjectType from './schema/buildObjectType';
import buildMutationInputType from './schema/buildMutationInputType';
import errorHandler from './errorHandler';
import buildBlockType from './schema/buildBlockType';
import buildPoliciesType from './schema/buildPoliciesType';
import buildLocaleInputType from './schema/buildLocaleInputType';
import buildFallbackLocaleInputType from './schema/buildFallbackLocaleInputType';
import initCollections from '../collections/graphql/init';
import initGlobals from '../globals/graphql/init';
import initPreferences from '../preferences/graphql/init';
import { GraphQLResolvers } from './bindResolvers';
import buildWhereInputType from './schema/buildWhereInputType';
import { SanitizedConfig } from '../config/types';

type GraphQLTypes = {
  blockTypes: any;
  blockInputTypes: any;
  localeInputType: any;
  fallbackLocaleInputType: any;
}

class InitializeGraphQL {
  types: GraphQLTypes;

  config: SanitizedConfig;

  graphQL: {
    resolvers: GraphQLResolvers
  };

  Query: { name: string; fields: { [key: string]: any } } = { name: 'Query', fields: {} };

  Mutation: { name: string; fields: { [key: string]: any } } = { name: 'Mutation', fields: {} };

  buildBlockType: typeof buildBlockType;

  buildMutationInputType: typeof buildMutationInputType;

  buildWhereInputType: (name: any, fields: any, parentName: any) => GraphQL.GraphQLInputObjectType;

  buildObjectType: typeof buildObjectType;

  buildPoliciesType: typeof buildPoliciesType;

  initCollections: typeof initCollections;

  initGlobals: typeof initGlobals;

  initPreferences: typeof initPreferences;

  schema: GraphQL.GraphQLSchema;

  extensions: (info: any) => Promise<any>;

  customFormatErrorFn: (error: GraphQLError) => GraphQLFormattedError;

  validationRules: any;

  errorResponses: GraphQLFormattedError[] = [];

  errorIndex: number;

  constructor(init) {
    Object.assign(this, init);
    this.init = this.init.bind(this);

    this.types = {
      blockTypes: {},
      blockInputTypes: {},
    } as GraphQLTypes;

    if (this.config.localization) {
      this.types.localeInputType = buildLocaleInputType(this.config.localization);
      this.types.fallbackLocaleInputType = buildFallbackLocaleInputType(this.config.localization);
    }

    this.Query = {
      name: 'Query',
      fields: {},
    };
    this.Mutation = {
      name: 'Mutation',
      fields: {},
    };

    this.buildBlockType = buildBlockType.bind(this);
    this.buildMutationInputType = buildMutationInputType.bind(this);
    this.buildWhereInputType = buildWhereInputType;
    this.buildObjectType = buildObjectType.bind(this);
    this.buildPoliciesType = buildPoliciesType.bind(this);
    this.initCollections = initCollections.bind(this);
    this.initGlobals = initGlobals.bind(this);
    this.initPreferences = initPreferences.bind(this);

    this.initCollections();
    this.initGlobals();
    this.initPreferences();

    this.Query.fields.Access = {
      type: this.buildPoliciesType(),
      resolve: this.graphQL.resolvers.collections.auth.access,
    };

    if (typeof this.config.graphQL.queries === 'function') {
      const customQueries = this.config.graphQL.queries(GraphQL, init);
      this.Query = {
        ...this.Query,
        fields: {
          ...this.Query.fields,
          ...(customQueries || {}),
        },
      };
    }

    if (typeof this.config.graphQL.mutations === 'function') {
      const customMutations = this.config.graphQL.mutations(GraphQL, init);
      this.Mutation = {
        ...this.Mutation,
        fields: {
          ...this.Mutation.fields,
          ...(customMutations || {}),
        },
      };
    }

    const query = new GraphQLObjectType(this.Query);
    const mutation = new GraphQLObjectType(this.Mutation);

    const schema = {
      query,
      mutation,
    };

    this.schema = new GraphQLSchema(schema);

    this.extensions = async (info) => {
      const { result } = info;
      if (result.errors) {
        this.errorIndex = 0;
        const afterErrorHook = typeof this.config.hooks.afterError === 'function' ? this.config.hooks.afterError : null;
        this.errorResponses = await errorHandler(info, this.config.debug, afterErrorHook);
      }
      return null;
    };
    this.customFormatErrorFn = (error) => {
      if (this.errorResponses && this.errorResponses[this.errorIndex]) {
        const response = this.errorResponses[this.errorIndex];
        this.errorIndex += 1;
        return response;
      }
      return error;
    };
    this.validationRules = (variables) => ([
      queryComplexity({
        estimators: [
          fieldExtensionsEstimator(),
          simpleEstimator({ defaultComplexity: 1 }), // Fallback if complexity not set
        ],
        maximumComplexity: this.config.graphQL.maxComplexity,
        variables,
        // onComplete: (complexity) => { console.log('Query Complexity:', complexity); },
      }),
    ]);
  }

  init(req, res) {
    this.errorResponses = null;
    return graphqlHTTP(
      async (request, response, { variables }) => ({
        schema: this.schema,
        customFormatErrorFn: this.customFormatErrorFn,
        extensions: this.extensions,
        context: { req, res },
        validationRules: this.validationRules(variables),
      }),
    );
  }
}

export default InitializeGraphQL;
