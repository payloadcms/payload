const {
  GraphQLList, GraphQLObjectType, GraphQLInt, GraphQLBoolean,
} = require('graphql');

const buildPaginatedListType = (name, docType) => {
  return new GraphQLObjectType({
    name,
    fields: {
      docs: {
        type: new GraphQLList(docType),
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
  });
};

module.exports = buildPaginatedListType;
