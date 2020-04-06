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
const { getFind, getFindByID } = require('../collections/graphql/resolvers');

const Query = {
  name: 'Query',
  fields: {},
};

// const Mutation = {
//   name: 'Mutation',
//   fields: {},
// };

function init() {
  this.graphQL = {
    types: {
      LocaleStringType: getLocaleStringType(this.config.localization),
      LocaleFloatType: getLocaleFloatType(this.config.localization),
      blockTypes: {},
    },
    addBlockType: (blockType, slug) => {
      this.graphQL.types.blockTypes[slug] = blockType;
    },
  };

  const buildObjectType = getBuildObjectType(this.config, this.graphQL);

  const userType = new GraphQLObjectType({
    name: 'User',
    fields: {
      id: { type: GraphQLString },
      email: { type: GraphQLString },
    },
  });

  Query.fields.User = {
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

    collection.graphQLType = buildObjectType(singularLabel, fields, singularLabel);

    collection.graphQLWhereInputType = buildWhereInputType({
      name: singularLabel,
      fields,
      parent: singularLabel,
    });

    Query.fields[singularLabel] = {
      type: collection.graphQLType,
      args: {
        id: { type: GraphQLString },
      },
      resolve: getFindByID(collection),
    };

    Query.fields[pluralLabel] = {
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

  const query = new GraphQLObjectType(Query);
  // const mutation = new GraphQLObjectType(Mutation);
  const schema = new GraphQLSchema({ query });

  return graphQLHTTP({ schema });
}

module.exports = init;
