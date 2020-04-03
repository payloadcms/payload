const graphQLHTTP = require('express-graphql');
const { GraphQLObjectType, GraphQLString, GraphQLSchema } = require('graphql');
const buildType = require('./buildObjectType');

const Query = {
  name: 'Query',
  fields: {},
};

const Mutation = {
  name: 'Mutation',
  fields: {},
};

function init() {
  const userType = new GraphQLObjectType({
    name: 'User',
    fields: {
      id: { type: GraphQLString },
      email: { type: GraphQLString },
    },
  });

  Query.fields.user = {
    type: userType,
    args: {
      id: { type: GraphQLString },
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

    const label = collection.config.labels.singular.replace(' ', '');

    collection.graphQLType = buildType(this.config, {
      name: label,
      fields: collection.config.fields,
    });

    Query.fields[label] = {
      type: collection.graphQLType,
      args: {
        id: { type: GraphQLString },
      },
      resolve: (_, { id }) => {
        return {
          id,
          email: 'test',
        };
      },
    };
  });

  const query = new GraphQLObjectType(Query);
  const mutation = new GraphQLObjectType(Mutation);

  const schema = new GraphQLSchema({ query, mutation });

  return graphQLHTTP({
    schema,
    graphiql: true,
    context: ({ req }) => ({
      user: req.user,
    }),
  });
}

module.exports = init;
