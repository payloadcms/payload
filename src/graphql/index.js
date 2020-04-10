const { GraphQLObjectType, GraphQLSchema } = require('graphql');

const graphQLHTTP = require('express-graphql');
const getBuildObjectType = require('./schema/getBuildObjectType');
const buildBlockTypeIfMissing = require('./schema/buildBlockTypeIfMissing');
const buildLocaleInputType = require('./schema/buildLocaleInputType');
const buildFallbackLocaleInputType = require('./schema/buildFallbackLocaleInputType');
const registerCollections = require('./schema/registerCollections');
const getBuildWhereInputType = require('./schema/getBuildWhereInputType');

class GraphQL {
  constructor(config, collections) {
    this.config = config;
    this.collections = collections;
    this.init = this.init.bind(this);

    this.types = {
      blockTypes: {},
      localeInputType: buildLocaleInputType(this.config.localization),
      fallbackLocaleInputType: buildFallbackLocaleInputType(this.config.localization),
    };

    this.Query = { name: 'Query', fields: {} };
    this.Mutation = { name: 'Mutation', fields: {} };

    this.buildWhereInputType = getBuildWhereInputType(this);
    this.buildObjectType = getBuildObjectType(this);
    this.buildBlockTypeIfMissing = buildBlockTypeIfMissing.bind(this);
    this.registerCollections = registerCollections.bind(this);
  }

  init() {
    this.registerCollections();

    const query = new GraphQLObjectType(this.Query);
    // const mutation = new GraphQLObjectType(Mutation);
    const schema = new GraphQLSchema({ query });

    return graphQLHTTP({ schema });
  }
}

module.exports = GraphQL;
