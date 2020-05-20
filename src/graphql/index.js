const { GraphQLObjectType, GraphQLSchema } = require('graphql');

const graphQLHTTP = require('express-graphql');
const buildObjectType = require('./schema/buildObjectType');
const buildMutationInputType = require('./schema/buildMutationInputType');
const buildBlockType = require('./schema/buildBlockType');
const buildLocaleInputType = require('./schema/buildLocaleInputType');
const buildFallbackLocaleInputType = require('./schema/buildFallbackLocaleInputType');
const registerCollections = require('../collections/graphql/register');
const registerGlobals = require('../globals/graphql/register');
const initUser = require('../users/graphql/init');
const buildWhereInputType = require('./schema/buildWhereInputType');
const errorHandler = require('./errorHandler');

class GraphQL {
  constructor(init) {
    Object.assign(this, init);
    this.init = this.init.bind(this);

    this.types = {
      blockTypes: {},
      blockInputTypes: {},
      localeInputType: buildLocaleInputType(this.config.localization),
      fallbackLocaleInputType: buildFallbackLocaleInputType(this.config.localization),
    };

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
    this.registerCollections = registerCollections.bind(this);
    this.initUser = initUser.bind(this);
    this.registerGlobals = registerGlobals.bind(this);
  }

  init() {
    this.registerCollections();
    this.initUser();
    this.registerGlobals();

    const query = new GraphQLObjectType(this.Query);
    const mutation = new GraphQLObjectType(this.Mutation);
    const schema = new GraphQLSchema({
      query,
      mutation,
    });

    let errorExtensions = [];
    let errorExtensionIteration = 0;

    const extensions = async (info) => {
      const { result } = info;
      if (result.errors) {
        const afterErrorHook = typeof this.config.hooks.afterError === 'function' ? this.config.hooks.afterError : null;
        errorExtensions = await errorHandler(info, this.config.debug, afterErrorHook);
      }
      return null;
    };

    return graphQLHTTP({
      schema,
      customFormatErrorFn: () => {
        const response = {
          ...errorExtensions[errorExtensionIteration],
        };
        errorExtensionIteration += 1;
        return response;
      },
      extensions,
    });
  }
}

module.exports = GraphQL;
