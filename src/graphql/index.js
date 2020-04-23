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
const registerUpload = require('../uploads/graphql/register');
const buildWhereInputType = require('./schema/buildWhereInputType');

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

    this.Query = { name: 'Query', fields: {} };
    this.Mutation = { name: 'Mutation', fields: {} };

    this.buildBlockType = buildBlockType.bind(this);
    this.buildMutationInputType = buildMutationInputType.bind(this);
    this.buildWhereInputType = buildWhereInputType;
    this.buildObjectType = buildObjectType.bind(this);
    this.registerCollections = registerCollections.bind(this);
    this.initUser = initUser.bind(this);
    this.registerUpload = registerUpload.bind(this);
    this.registerGlobals = registerGlobals.bind(this);
  }

  init() {
    this.registerCollections();
    this.initUser();
    this.registerUpload();
    this.registerGlobals();

    const query = new GraphQLObjectType(this.Query);
    const mutation = new GraphQLObjectType(this.Mutation);
    const schema = new GraphQLSchema({ query, mutation });

    return graphQLHTTP({ schema });
  }
}

module.exports = GraphQL;
