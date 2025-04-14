import { GraphQLBoolean, GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLObjectType } from 'graphql'

export const buildPaginatedListType = (name, docType) =>
  new GraphQLObjectType({
    name,
    fields: {
      docs: {
        type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(docType))),
      },
      hasNextPage: { type: new GraphQLNonNull(GraphQLBoolean) },
      hasPrevPage: { type: new GraphQLNonNull(GraphQLBoolean) },
      limit: { type: new GraphQLNonNull(GraphQLInt) },
      nextPage: { type: new GraphQLNonNull(GraphQLInt) },
      offset: { type: GraphQLInt },
      page: { type: new GraphQLNonNull(GraphQLInt) },
      pagingCounter: { type: new GraphQLNonNull(GraphQLInt) },
      prevPage: { type: new GraphQLNonNull(GraphQLInt) },
      totalDocs: { type: new GraphQLNonNull(GraphQLInt) },
      totalPages: { type: new GraphQLNonNull(GraphQLInt) },
    },
  })
