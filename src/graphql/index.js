const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLSchema,
  GraphQLNonNull,
  GraphQLList,
  GraphQLInt,
  GraphQLBoolean,
} = require('graphql');
const graphQLHTTP = require('express-graphql');
const getBuildObjectType = require('./schema/getBuildObjectType');
const buildWhereInputType = require('./schema/buildWhereInputType');
const formatName = require('./utilities/formatName');
const getLocaleStringType = require('./types/getLocaleStringType');
const getLocaleFloatType = require('./types/getLocaleFloatType');
const getBuildLocaleObjectType = require('./types/getBuildLocaleObjectType');
const { getFind, getFindByID } = require('../collections/graphql/resolvers');

class GraphQL {
  constructor(config, collections) {
    this.init = this.init.bind(this);
    this.registerUser = this.registerUser.bind(this);
    this.registerCollections = this.registerCollections.bind(this);
    this.addBlockType = this.addBlockType.bind(this);

    this.config = config;
    this.collections = collections;

    this.Query = {
      name: 'Query',
      fields: {},
    };

    this.Mutation = {
      name: 'Mutation',
      fields: {},
    };

    this.types = {
      LocaleStringType: getLocaleStringType(this.config.localization),
      LocaleFloatType: getLocaleFloatType(this.config.localization),
      blockTypes: {},
    };

    this.buildLocaleObjectType = getBuildLocaleObjectType(this);
    this.buildObjectType = getBuildObjectType(this);
  }

  init() {
    this.registerUser();
    this.registerCollections();

    const query = new GraphQLObjectType(this.Query);
    // const mutation = new GraphQLObjectType(Mutation);
    const schema = new GraphQLSchema({ query });

    return graphQLHTTP({ schema });
  }

  registerUser() {
    const userType = new GraphQLObjectType({
      name: 'User',
      fields: {
        id: { type: GraphQLString },
        email: { type: GraphQLString },
      },
    });

    this.Query.fields.User = {
      type: userType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: (_, { id }) => {
        return {
          id,
          email: 'test',
        };
      },
    };
  }

  registerCollections() {
    Object.keys(this.collections).forEach((collectionKey) => {
      const collection = this.collections[collectionKey];

      const {
        config: {
          fields,
          labels: {
            singular,
            plural,
          },
        },
      } = collection;

      const singularLabel = formatName(singular);
      const pluralLabel = formatName(plural);

      collection.graphQLType = this.buildObjectType(singularLabel, fields, singularLabel);

      collection.graphQLWhereInputType = buildWhereInputType({
        name: singularLabel,
        fields,
        parent: singularLabel,
      });

      this.Query.fields[singularLabel] = {
        type: collection.graphQLType,
        args: {
          id: { type: GraphQLString },
        },
        resolve: getFindByID(collection),
      };

      this.Query.fields[pluralLabel] = {
        type: new GraphQLObjectType({
          name: pluralLabel,
          fields: {
            docs: {
              type: new GraphQLList(collection.graphQLType),
            },
            totalDocs: { type: GraphQLInt },
            offset: { type: GraphQLInt },
            limit: { type: GraphQLInt },
            totalPages: { type: GraphQLInt },
            page: { type: GraphQLInt },
            pagingCounter: { type: GraphQLInt },
            hasPrevPage: { type: GraphQLBoolean },
            hasNextPage: { type: GraphQLBoolean },
            prevPage: { type: GraphQLBoolean },
            nextPage: { type: GraphQLBoolean },
          },
        }),
        args: {
          where: { type: collection.graphQLWhereInputType },
        },
        resolve: getFind(collection),
      };
    });
  }

  addBlockType(blockType, slug) {
    this.types.blockTypes[slug] = blockType;
  }
}

module.exports = GraphQL;
