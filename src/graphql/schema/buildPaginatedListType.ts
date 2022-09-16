import { GraphQLBoolean, GraphQLInt, GraphQLList, GraphQLObjectType } from 'graphql';

const buildPaginatedListType = (name, docType) => new GraphQLObjectType({
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
    prevPage: { type: GraphQLInt },
    nextPage: { type: GraphQLInt },
  },
});

export default buildPaginatedListType;
