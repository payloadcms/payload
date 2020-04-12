const { GraphQLObjectType, GraphQLSchema } = require('graphql');

const graphQLHTTP = require('express-graphql');
const buildObjectType = require('./schema/buildObjectType');
const buildMutationInputType = require('./schema/buildMutationInputType');
const buildBlockType = require('./schema/buildBlockType');
const buildLocaleInputType = require('./schema/buildLocaleInputType');
const buildFallbackLocaleInputType = require('./schema/buildFallbackLocaleInputType');
const registerCollections = require('../collections/graphql/register');
const registerUser = require('../auth/graphql/register');
const registerUpload = require('../uploads/graphql/register');
const buildWhereInputType = require('./schema/buildWhereInputType');

class GraphQL {
  constructor(config, collections, User, Upload) {
    this.config = config;
    this.User = User;
    this.Upload = Upload;
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
    this.buildMutationInputType = buildMutationInputType.bind(this);
    this.buildWhereInputType = buildWhereInputType;
    this.buildObjectType = buildObjectType.bind(this);
    this.registerCollections = registerCollections.bind(this);
    this.registerUser = registerUser.bind(this);
    this.registerUpload = registerUpload.bind(this);
  }

  init() {
    this.registerCollections();
    this.registerUser();
    this.registerUpload();

    const query = new GraphQLObjectType(this.Query);
    const mutation = new GraphQLObjectType(this.Mutation);
    const schema = new GraphQLSchema({ query, mutation });

    return graphQLHTTP({ schema });
  }
}

module.exports = GraphQL;
