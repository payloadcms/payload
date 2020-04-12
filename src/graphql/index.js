const { GraphQLObjectType, GraphQLSchema } = require('graphql');

const graphQLHTTP = require('express-graphql');
const buildObjectType = require('./schema/buildObjectType');
const buildMutationInputType = require('./schema/buildMutationInputType');
const buildBlockType = require('./schema/buildBlockType');
const buildBlockInputType = require('./schema/buildBlockInputType');
const buildLocaleInputType = require('./schema/buildLocaleInputType');
const buildFallbackLocaleInputType = require('./schema/buildFallbackLocaleInputType');
const registerCollections = require('./schema/registerCollections');
const buildWhereInputType = require('./schema/buildWhereInputType');

class GraphQL {
  constructor(config, collections) {
    this.config = config;
    this.collections = collections;
    this.init = this.init.bind(this);

    this.types = {
      blockTypes: {},
      blockInputTypes: {},
      localeInputType: buildLocaleInputType(this.config.localization),
      fallbackLocaleInputType: buildFallbackLocaleInputType(this.config.localization),
    };

    this.Query = { name: 'Query', fields: {} };
    this.Mutation = { name: 'Mutation', fields: {} };

    this.buildBlockType = buildBlockType.bind(this);
    this.buildBlockInputType = buildBlockInputType.bind(this);
    this.buildMutationInputType = buildMutationInputType.bind(this);
    this.buildWhereInputType = buildWhereInputType;
    this.buildObjectType = buildObjectType.bind(this);
    this.registerCollections = registerCollections.bind(this);
  }

  init() {
    this.registerCollections();

    const query = new GraphQLObjectType(this.Query);
    const mutation = new GraphQLObjectType(this.Mutation);
    const schema = new GraphQLSchema({ query, mutation });

    return graphQLHTTP({ schema });
  }
}

module.exports = GraphQL;
