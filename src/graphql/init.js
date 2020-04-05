const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLSchema,
  GraphQLNonNull,
} = require('graphql');
const graphQLHTTP = require('express-graphql');
const getBuildObjectType = require('./schema/getBuildObjectType');
const buildWhereInputType = require('./schema/buildWhereInputType');
const formatName = require('./utilities/formatName');
const withPolicy = require('./resolvers/withPolicy');
const getLocaleStringType = require('./types/getLocaleStringType');
const getLocaleFloatType = require('./types/getLocaleFloatType');
const { findByID } = require('../collections/queries');

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
        policies,
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
      resolve: withPolicy(policies.read, async (_, { id }) => {
        const doc = findByID({
          depth: 0,
          Model: collection.model,
          id,
        });

        return doc;
      }),
    };

    Query.fields[`get${pluralLabel}`] = {
      type: collection.graphQLType,
      args: {
        where: { type: collection.graphQLWhereInputType },
      },
      resolve: withPolicy(policies.read, async (_, args, context) => {
        return {
          image: 'test',
        };
      }),
    };
  });

  const query = new GraphQLObjectType(Query);
  // const mutation = new GraphQLObjectType(Mutation);
  const schema = new GraphQLSchema({ query });

  return graphQLHTTP({ schema });
}

module.exports = init;
