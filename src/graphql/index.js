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
const buildBlockTypeIfMissing = require('./schema/buildBlockTypeIfMissing');
const buildWhereInputType = require('./schema/buildWhereInputType');
const buildLocaleInputType = require('./schema/buildLocaleInputType');
const buildPaginatedListType = require('./schema/buildPaginatedListType');
const buildFallbackLocaleInputType = require('./schema/buildFallbackLocaleInputType');
const formatName = require('./utilities/formatName');
const { getFind, getFindByID } = require('../collections/graphql/resolvers');

class GraphQL {
  constructor(config, collections) {
    this.config = config;
    this.collections = collections;

    this.init = this.init.bind(this);
    this.registerUser = this.registerUser.bind(this);
    this.registerCollections = this.registerCollections.bind(this);

    this.Query = {
      name: 'Query',
      fields: {},
    };

    this.Mutation = {
      name: 'Mutation',
      fields: {},
    };

    this.types = {
      blockTypes: {},
      localeInputType: buildLocaleInputType(this.config.localization),
      fallbackLocaleInputType: buildFallbackLocaleInputType(this.config.localization),
    };

    this.buildObjectType = getBuildObjectType(this);
    this.buildBlockTypeIfMissing = buildBlockTypeIfMissing.bind(this);
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
    Object.keys(this.collections).forEach((slug) => {
      const {
        config: {
          labels: {
            singular,
          },
          fields,
        },
      } = this.collections[slug];

      const singularLabel = formatName(singular);

      this.collections[slug].graphQLType = this.buildObjectType(
        singularLabel,
        fields,
        singularLabel,
        getFindByID(this.config, this.collections[slug]),
      );
    });

    Object.keys(this.collections).forEach((collectionSlug) => {
      const collection = this.collections[collectionSlug];

      const {
        config: {
          slug,
          fields,
          labels: {
            singular,
            plural,
          },
        },
      } = collection;

      const singularLabel = formatName(singular);
      const pluralLabel = formatName(plural);

      collection.graphQLWhereInputType = buildWhereInputType({
        name: singularLabel,
        fields,
        parent: singularLabel,
      });

      this.Query.fields[singularLabel] = {
        type: this.collections[slug].graphQLType,
        args: {
          id: { type: GraphQLString },
        },
        resolve: getFindByID(this.config, collection),
      };

      this.Query.fields[pluralLabel] = {
        type: buildPaginatedListType(pluralLabel, collection.graphQLType),
        args: {
          where: {
            type: collection.graphQLWhereInputType,
          },
          locale: {
            type: this.types.localeInputType,
          },
          fallbackLocale: {
            type: this.types.fallbackLocaleInputType,
          },
        },
        resolve: getFind(this.config, collection),
      };
    });
  }
}

module.exports = GraphQL;
