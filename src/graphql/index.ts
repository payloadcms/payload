import GraphQL, { GraphQLObjectType, GraphQLSchema } from 'graphql';
import graphQLHTTP from 'express-graphql';
import queryComplexity, { simpleEstimator, fieldExtensionsEstimator } from 'graphql-query-complexity';
import buildObjectType from './schema/buildObjectType';
import buildMutationInputType from './schema/buildMutationInputType';
import errorHandler from './errorHandler';
import buildBlockType from './schema/buildBlockType';
import buildPoliciesType from './schema/buildPoliciesType';
import buildLocaleInputType from './schema/buildLocaleInputType';
import buildFallbackLocaleInputType from './schema/buildFallbackLocaleInputType';
import initCollections from '../collections/graphql/init';
import initGlobals from '../globals/graphql/init';
import buildWhereInputType from './schema/buildWhereInputType';
import access from '../auth/graphql/resolvers/access';

class InitializeGraphQL {
  constructor(init) {
    Object.assign(this, init);
    this.init = this.init.bind(this);

    this.types = {
      blockTypes: {},
      blockInputTypes: {},
    };

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

    this.initCollections();
    this.initGlobals();

    this.Query.fields.Access = {
      type: this.buildPoliciesType(),
      resolve: access,
    };

    if (typeof this.config.graphQL.queries === 'function') {
      const customQueries = this.config.graphQL.queries(GraphQL, this);
      this.Query = {
        ...this.Query,
        fields: {
          ...this.Query.fields,
          ...(customQueries || {}),
        },
      };
    }

    if (typeof this.config.graphQL.mutations === 'function') {
      const customMutations = this.config.graphQL.mutations(GraphQL, this);
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
        const afterErrorHook = typeof this.config.hooks.afterError === 'function' ? this.config.hooks.afterError : null;
        [this.errorResponse] = await errorHandler(info, this.config.debug, afterErrorHook);
      }
      return null;
    };
    this.customFormatErrorFn = () => (this.errorResponse);
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
    this.errorResponse = null;
    return graphQLHTTP(
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
