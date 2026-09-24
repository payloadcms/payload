import { graphql, GraphQLList, GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql'
import { describe, expect, it } from 'vitest'

import { buildSelectForCollection, resolveSelect } from './select.js'

describe('GraphQL select projection', () => {
  it('should preserve the relationship select when its containing array is aliased', async () => {
    let relationshipSelect: ReturnType<typeof buildSelectForCollection>

    const relatedType = new GraphQLObjectType({
      name: 'Related',
      fields: { name: { type: GraphQLString } },
    })
    const arrayItemType = new GraphQLObjectType({
      name: 'ArrayItem',
      fields: {
        link: {
          type: relatedType,
          extensions: { field: { name: 'link', type: 'relationship' } },
          resolve(_parent, _args, context, info) {
            relationshipSelect = resolveSelect(info, context.select)
            return { name: 'related' }
          },
        },
      },
    })
    const documentType = new GraphQLObjectType({
      name: 'Document',
      fields: {
        array: {
          type: new GraphQLList(arrayItemType),
          extensions: { field: { name: 'array', type: 'array' } },
        },
      },
    })
    const schema = new GraphQLSchema({
      query: new GraphQLObjectType({
        name: 'Query',
        fields: {
          Document: {
            type: documentType,
            resolve(_parent, _args, context, info) {
              context.select = buildSelectForCollection(info)
              return { array: [{ link: '1' }] }
            },
          },
        },
      }),
    })

    const result = await graphql({
      schema,
      source: '{ Document { renamed: array { link { name } } } }',
      contextValue: { select: undefined },
    })

    expect(result.errors).toBeUndefined()
    expect(result.data?.Document).toEqual({ renamed: [{ link: { name: 'related' } }] })
    expect(relationshipSelect).toEqual({ name: true })
  })
})
