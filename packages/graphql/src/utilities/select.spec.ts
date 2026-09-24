import {
  graphql,
  GraphQLList,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  GraphQLUnionType,
} from 'graphql'
import { describe, expect, it } from 'vitest'

import { buildSelectForCollection, resolveSelect } from './select.js'

describe('GraphQL select projection', () => {
  it('should keep separate relationship selections for aliases of the same array', async () => {
    let rootSelect: ReturnType<typeof buildSelectForCollection>
    const relationshipSelectByArrayAlias = new Map<string, unknown>()

    const relatedType = new GraphQLObjectType({
      name: 'Related',
      fields: {
        id: { type: GraphQLString },
        name: { type: GraphQLString },
      },
    })
    const arrayItemType = new GraphQLObjectType({
      name: 'ArrayItem',
      fields: {
        link: {
          type: relatedType,
          extensions: { field: { name: 'link', type: 'relationship' } },
          resolve(_parent, _args, context, info) {
            const arrayAlias = String(info.path.prev?.prev?.key)

            relationshipSelectByArrayAlias.set(
              arrayAlias,
              resolveSelect(info, context.select, context),
            )

            return { id: '1', name: 'related' }
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
              rootSelect = context.select = buildSelectForCollection(info, context)

              return { array: [{ link: '1' }] }
            },
          },
        },
      }),
    })

    const result = await graphql({
      schema,
      source: '{ Document { first: array { link { name } } second: array { link { id } } } }',
      contextValue: { select: undefined },
    })

    expect(result.errors).toBeUndefined()
    expect(rootSelect).toEqual({ array: { link: { id: true, name: true } } })
    expect(relationshipSelectByArrayAlias.get('first')).toEqual({ name: true })
    expect(relationshipSelectByArrayAlias.get('second')).toEqual({ id: true })
  })

  it('should merge selection sets from repeated relationship field nodes', async () => {
    let relationshipFieldNodeCount = 0
    let relationshipSelect: ReturnType<typeof buildSelectForCollection>

    const relatedType = new GraphQLObjectType({
      name: 'RepeatedFieldRelated',
      fields: {
        id: { type: GraphQLString },
        name: { type: GraphQLString },
      },
    })
    const documentType = new GraphQLObjectType({
      name: 'RepeatedFieldDocument',
      fields: {
        link: {
          type: relatedType,
          extensions: { field: { name: 'link', type: 'relationship' } },
          resolve(_parent, _args, context, info) {
            relationshipFieldNodeCount = info.fieldNodes.length
            relationshipSelect = resolveSelect(info, context.select, context)

            return { id: '1', name: 'related' }
          },
        },
      },
    })
    const schema = new GraphQLSchema({
      query: new GraphQLObjectType({
        name: 'RepeatedFieldQuery',
        fields: {
          Document: {
            type: documentType,
            resolve(_parent, _args, context, info) {
              context.select = buildSelectForCollection(info, context)

              return { link: '1' }
            },
          },
        },
      }),
    })

    const result = await graphql({
      schema,
      source: '{ Document { link { name } link { id } } }',
      contextValue: { select: undefined },
    })

    expect(result.errors).toBeUndefined()
    expect(relationshipFieldNodeCount).toBe(2)
    expect(relationshipSelect).toEqual({ id: true, name: true })
  })

  it('should merge inline and named fragments for the same block type', async () => {
    let rootSelect: ReturnType<typeof buildSelectForCollection>

    const contentBlockType = new GraphQLObjectType({
      name: 'ContentBlock',
      extensions: { blockSlug: 'content' },
      fields: {
        first: { type: GraphQLString },
        second: { type: GraphQLString },
      },
    })
    const blocksType = new GraphQLUnionType({
      name: 'Blocks',
      resolveType: () => 'ContentBlock',
      types: [contentBlockType],
    })
    const documentType = new GraphQLObjectType({
      name: 'BlockDocument',
      fields: {
        blocks: {
          type: new GraphQLList(blocksType),
          extensions: { field: { name: 'blocks', type: 'blocks' } },
        },
      },
    })
    const schema = new GraphQLSchema({
      query: new GraphQLObjectType({
        name: 'BlockQuery',
        fields: {
          Document: {
            type: documentType,
            resolve(_parent, _args, context, info) {
              rootSelect = context.select = buildSelectForCollection(info, context)

              return { blocks: [{ first: 'first', second: 'second' }] }
            },
          },
        },
      }),
    })

    const result = await graphql({
      schema,
      source: `query {
        Document {
          blocks {
            ... on ContentBlock { first }
            ...ContentBlockFields
          }
        }
      }

      fragment ContentBlockFields on ContentBlock {
        second
      }`,
      contextValue: { select: undefined },
    })

    expect(result.errors).toBeUndefined()
    expect(rootSelect).toEqual({
      blocks: {
        content: {
          first: true,
          second: true,
        },
      },
    })
  })

  it('should resolve polymorphic relationship and join selections inside an aliased group', async () => {
    let joinSelect: ReturnType<typeof buildSelectForCollection>
    let polymorphicRelationshipSelect: ReturnType<typeof buildSelectForCollection>

    const relatedType = new GraphQLObjectType({
      name: 'NestedRelated',
      fields: { name: { type: GraphQLString } },
    })
    const polymorphicValueType = new GraphQLUnionType({
      name: 'PolymorphicValue',
      resolveType: () => 'NestedRelated',
      types: [relatedType],
    })
    const polymorphicRelationshipType = new GraphQLObjectType({
      name: 'PolymorphicRelationship',
      fields: {
        relationTo: { type: GraphQLString },
        value: { type: polymorphicValueType },
      },
    })
    const joinType = new GraphQLObjectType({
      name: 'NestedJoin',
      fields: { docs: { type: new GraphQLList(relatedType) } },
    })
    const groupType = new GraphQLObjectType({
      name: 'NestedGroup',
      fields: {
        join: {
          type: joinType,
          extensions: { field: { name: 'join', type: 'join' } },
          resolve(_parent, _args, context, info) {
            joinSelect = resolveSelect(info, context.select, context)

            return { docs: [{ name: 'joined' }] }
          },
        },
        relation: {
          type: polymorphicRelationshipType,
          extensions: {
            field: { name: 'relation', relationTo: ['first', 'second'], type: 'relationship' },
          },
          resolve(_parent, _args, context, info) {
            polymorphicRelationshipSelect = resolveSelect(info, context.select, context)

            return { relationTo: 'first', value: { name: 'related' } }
          },
        },
      },
    })
    const documentType = new GraphQLObjectType({
      name: 'NestedDocument',
      fields: {
        group: {
          type: groupType,
          extensions: { field: { name: 'group', type: 'group' } },
        },
      },
    })
    const schema = new GraphQLSchema({
      query: new GraphQLObjectType({
        name: 'NestedQuery',
        fields: {
          Document: {
            type: documentType,
            resolve(_parent, _args, context, info) {
              context.select = buildSelectForCollection(info, context)

              return { group: {} }
            },
          },
        },
      }),
    })

    const result = await graphql({
      schema,
      source: `{
        Document {
          renamed: group {
            join { docs { name } }
            relation { value { ... on NestedRelated { name } } }
          }
        }
      }`,
      contextValue: { select: undefined },
    })

    expect(result.errors).toBeUndefined()
    expect(joinSelect).toEqual({ name: true })
    expect(polymorphicRelationshipSelect).toEqual({ name: true })
  })

  it('should keep select state separate for concurrent root fields', async () => {
    const relationshipSelectByRootField = new Map<string, unknown>()

    const relatedType = new GraphQLObjectType({
      name: 'ConcurrentRelated',
      fields: {
        id: { type: GraphQLString },
        name: { type: GraphQLString },
      },
    })
    const documentType = new GraphQLObjectType({
      name: 'ConcurrentDocument',
      fields: {
        link: {
          type: relatedType,
          extensions: { field: { name: 'link', type: 'relationship' } },
          resolve(_parent, _args, context, info) {
            let rootPath = info.path

            while (rootPath.prev) {
              rootPath = rootPath.prev
            }

            relationshipSelectByRootField.set(
              String(rootPath.key),
              resolveSelect(info, context.select, context),
            )

            return { id: '1', name: 'related' }
          },
        },
      },
    })
    const schema = new GraphQLSchema({
      query: new GraphQLObjectType({
        name: 'ConcurrentQuery',
        fields: {
          SelectedDocument: {
            type: documentType,
            async resolve(_parent, _args, context, info) {
              context.select = buildSelectForCollection(info, context)
              await Promise.resolve()

              return { link: '1' }
            },
          },
          UnselectedDocument: {
            type: documentType,
            async resolve(_parent, _args, context) {
              context.select = undefined
              await Promise.resolve()

              return { link: '1' }
            },
          },
        },
      }),
    })

    const result = await graphql({
      schema,
      source: '{ SelectedDocument { link { name } } UnselectedDocument { link { id } } }',
      contextValue: { select: undefined },
    })

    expect(result.errors).toBeUndefined()
    expect(relationshipSelectByRootField.get('SelectedDocument')).toEqual({ name: true })
    expect(relationshipSelectByRootField.get('UnselectedDocument')).toBeUndefined()
  })
})
