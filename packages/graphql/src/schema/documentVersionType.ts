import { GraphQLEnumType } from 'graphql'

export const documentVersionType = new GraphQLEnumType({
  name: 'DocumentVersion',
  values: {
    draft: { value: 'draft' },
    latest: { value: 'latest' },
    published: { value: 'published' },
  },
})

export const createDocumentVersionType = new GraphQLEnumType({
  name: 'CreateDocumentVersion',
  values: {
    draft: { value: 'draft' },
    published: { value: 'published' },
  },
})
