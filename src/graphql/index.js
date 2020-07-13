const { GraphQLObjectType, GraphQLSchema } = require('graphql');

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
const errorHandler = require('./errorHandler');
const { access } = require('../auth/graphql/resolvers');

class GraphQL {
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
      resolve: access(this.config),
    };

    this.Query = {
      ...this.Query,
      ...(this.config.queries),
    };

    this.Mutation = {
      ...this.Mutation,
      ...(this.config.mutations),
    };

    const query = new GraphQLObjectType(this.Query);
    const mutation = new GraphQLObjectType(this.Mutation);

    this.schema = new GraphQLSchema({
      query,
      mutation,
    });

    this.errorExtensions = [];
    this.errorExtensionIteration = 0;

    this.extensions = async (info) => {
      const { result } = info;
      if (result.errors) {
        const afterErrorHook = typeof this.config.hooks.afterError === 'function' ? this.config.hooks.afterError : null;
        this.errorExtensions = await errorHandler(info, this.config.debug, afterErrorHook);
      }
      return null;
    };
  }

  init(req, res) {
    return graphQLHTTP({
      schema: this.schema,
      customFormatErrorFn: () => {
        const response = {
          ...this.errorExtensions[this.errorExtensionIteration],
        };
        this.errorExtensionIteration += 1;
        return response;
      },
      extensions: this.extensions,
      context: { req, res },
    });
  }
}

module.exports = GraphQL;
