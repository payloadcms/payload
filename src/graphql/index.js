const GraphQL = require('graphql');

const { GraphQLObjectType, GraphQLSchema } = GraphQL;
const queryComplexityImport = require('graphql-query-complexity');

const queryComplexity = queryComplexityImport.default;
const {
  fieldExtensionsEstimator,
  simpleEstimator,
} = queryComplexityImport;

const graphQLHTTP = require('express-graphql');
const buildObjectType = require('./schema/buildObjectType');
const buildMutationInputType = require('./schema/buildMutationInputType');
const buildBlockType = require('./schema/buildBlockType');
const buildPoliciesType = require('./schema/buildPoliciesType');
const buildLocaleInputType = require('./schema/buildLocaleInputType');
const buildFallbackLocaleInputType = require('./schema/buildFallbackLocaleInputType');
const initCollections = require('../collections/graphql/init');
const initGlobals = require('../globals/graphql/init');
const buildWhereInputType = require('./schema/buildWhereInputType');
const access = require('../auth/graphql/resolvers/access');
const errorHandler = require('./errorHandler');

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
        this.errorResponse = await errorHandler(info, this.config.debug, afterErrorHook);
      }
      return null;
    };
  }

  init(req, res) {
    this.errorResponse = null;
    return graphQLHTTP(
      async (request, response, { variables }) => ({
        schema: this.schema,
        customFormatErrorFn: () => (this.errorResponse),
        extensions: this.extensions,
        context: { req, res },
        validationRules: [
          queryComplexity({
            estimators: [
              fieldExtensionsEstimator(),
              simpleEstimator({ defaultComplexity: 1 }), // Fallback if complexity not set
            ],
            maximumComplexity: this.config.graphQL.maxComplexity,
            variables,
            // onComplete: (complexity) => { console.log('Query Complexity:', complexity); },
          }),
        ],
      }),
    );
  }
}

module.exports = InitializeGraphQL;
