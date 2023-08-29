import { GraphQLBoolean, GraphQLInt, GraphQLList, GraphQLObjectType } from 'graphql'

const buildPaginatedListType = (name, docType) =>
  new GraphQLObjectType({
    fields: {
      docs: {
        type: new GraphQLList(docType),
      },
      hasNextPage: { type: GraphQLBoolean },
      hasPrevPage: { type: GraphQLBoolean },
      limit: { type: GraphQLInt },
      nextPage: { type: GraphQLInt },
      offset: { type: GraphQLInt },
      page: { type: GraphQLInt },
      pagingCounter: { type: GraphQLInt },
      prevPage: { type: GraphQLInt },
      totalDocs: { type: GraphQLInt },
      totalPages: { type: GraphQLInt },
    },
    name,
  })

export default buildPaginatedListType
