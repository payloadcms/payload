const graphQLHTTP = require('express-graphql');
const { GraphQLObjectType, GraphQLString, GraphQLSchema } = require('graphql');

const queryType = {
  name: 'Query',
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

  queryType.fields.user = {
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

  const query = new GraphQLObjectType(queryType);
  const schema = new GraphQLSchema({ query });

  return graphQLHTTP({
    schema,
    graphiql: true,
    context: ({ req }) => ({
      user: req.user,
    }),
  });
}

module.exports = init;
