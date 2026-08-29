import type { GraphQLInputObjectType, GraphQLObjectType, GraphQLUnionType } from 'graphql'
import type { Payload } from 'payload'

import { configToSchema } from '@payloadcms/graphql'
import { getNamedType, GraphQLNonNull } from 'graphql'
import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { idToString } from '../__helpers/shared/idToString.js'
import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { recursiveBlockInterfaceName } from './blocks/RecursiveBlock.js'

let payload: Payload
let restClient: NextRESTClient

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('graphql', () => {
  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(dirname))
  })

  afterAll(async () => {
    await payload.destroy()
  })

  describe('graphql', () => {
    it('should return 404 when GraphQL is disabled', async () => {
      const originalDisable = payload.config.graphQL?.disable

      payload.config.graphQL.disable = true

      try {
        const response = await restClient.GRAPHQL_POST({
          body: JSON.stringify({
            query: `query {
          Posts {
            docs {
              id
            }
          }
        }`,
          }),
        })

        expect(response.status).toBe(404)
      } finally {
        payload.config.graphQL.disable = originalDisable
      }
    })

    it('should not be able to query introspection', async () => {
      const query = `query {
        __schema {
          queryType {
            name
          }
        }
      }`

      const response = await restClient
        .GRAPHQL_POST({
          body: JSON.stringify({ query }),
        })
        .then((res) => res.json())

      expect(response.errors[0].message).toMatch(
        'GraphQL introspection is not allowed, but the query contained __schema or __type',
      )
    })

    it('should respect maxComplexity', async () => {
      const post = await payload.create({
        collection: 'posts',
        data: {
          title: 'example post',
        },
      })
      await payload.update({
        collection: 'posts',
        id: post.id,
        data: {
          relationToSelf: post.id,
        },
      })

      const query = `query {
        Post(id: ${idToString(post.id, payload)}) {
          title
          relationToSelf {
            id
          }
        }
      }`

      const response = await restClient
        .GRAPHQL_POST({
          body: JSON.stringify({ query }),
        })
        .then((res) => res.json())

      expect(response.errors[0].message).toMatch(
        'The query exceeds the maximum complexity of 800. Actual complexity is 804',
      )
    })

    it('should sanitize hyphenated field names to snake case', async () => {
      const post = await payload.create({
        collection: 'posts',
        data: {
          title: 'example post',
          'hyphenated-name': 'example-hyphenated-name',
        },
      })

      const query = `query {
        Post(id: ${idToString(post.id, payload)}) {
          title
          hyphenated_name
        }
      }`

      const { data } = await restClient
        .GRAPHQL_POST({ body: JSON.stringify({ query }) })
        .then((res) => res.json())
      const res = data.Post

      expect(res.hyphenated_name).toStrictEqual('example-hyphenated-name')
    })

    it('should not error because of non nullable fields', async () => {
      await payload.delete({ collection: 'posts', where: {} })

      // this is an array if any errors
      const res_1 = await restClient
        .GRAPHQL_POST({
          body: JSON.stringify({
            query: `
query {
  Posts {
    docs {
      title
    }
    prevPage
  }
}
        `,
          }),
        })
        .then((res) => res.json())
      expect(res_1.errors).toBeFalsy()

      await payload.create({
        collection: 'posts',
        data: { title: 'any-title' },
      })

      const res_2 = await restClient
        .GRAPHQL_POST({
          body: JSON.stringify({
            query: `
query {
  Posts(limit: 1) {
    docs {
      title
    }
  }
}
        `,
          }),
        })
        .then((res) => res.json())
      expect(res_2.errors).toBeFalsy()
    })

    it('should handle blocks with select: true', async () => {
      const createdPost = await payload.create({
        collection: 'posts',
        data: {
          title: 'Test Post with Blocks',
          contentBlockField: [
            {
              blockType: 'content',
              text: 'Hello World from Block',
            },
          ],
        },
      })

      // Query without select: true
      const queryWithoutSelect = `query {
        Post(id: ${idToString(createdPost.id, payload)}) {
          title
          contentBlockField {
            ... on Content {
              text
            }
          }
        }
      }`

      const responseWithoutSelect = await restClient
        .GRAPHQL_POST({ body: JSON.stringify({ query: queryWithoutSelect }) })
        .then((res) => res.json())

      expect(responseWithoutSelect.errors).toBeFalsy()
      expect(responseWithoutSelect.data.Post.title).toBe('Test Post with Blocks')
      expect(responseWithoutSelect.data.Post.contentBlockField).toHaveLength(1)
      expect(responseWithoutSelect.data.Post.contentBlockField[0].text).toBe(
        'Hello World from Block',
      )

      // Query with select: true
      const queryWithSelect = `query {
        Posts(select: true, where: { id: { equals: ${idToString(createdPost.id, payload)} } }) {
          docs {
            title
            contentBlockField {
              ... on Content {
                text
              }
            }
          }
        }
      }`

      const responseWithSelect = await restClient
        .GRAPHQL_POST({ body: JSON.stringify({ query: queryWithSelect }) })
        .then((res) => res.json())

      expect(responseWithSelect.errors).toBeFalsy()
      expect(responseWithSelect.data.Posts.docs).toHaveLength(1)
      expect(responseWithSelect.data.Posts.docs[0].title).toBe('Test Post with Blocks')
      expect(responseWithSelect.data.Posts.docs[0].contentBlockField).toHaveLength(1)
      expect(responseWithSelect.data.Posts.docs[0].contentBlockField[0].text).toBe(
        'Hello World from Block',
      )

      await payload.delete({
        collection: 'posts',
        id: createdPost.id,
      })
    })

    it('should not error when querying a global with a deleted relationship in an array', async () => {
      const post1 = await payload.create({
        collection: 'posts',
        data: {
          title: 'Post 1',
        },
      })

      await payload.updateGlobal({
        slug: 'home',
        data: {
          topPosts: [
            {
              post: post1.id,
              caption: 'The best post out there',
            },
          ],
        },
      })

      const query = `query {
        Home {
          topPosts {
            post {
              title
            }
          }
        }
      }`

      const beforeDelete = await restClient
        .GRAPHQL_POST({ body: JSON.stringify({ query }) })
        .then((res) => res.json())

      expect(beforeDelete.errors).toBeUndefined()
      expect(beforeDelete.data.Home.topPosts).toEqual([
        expect.objectContaining({ post: { title: 'Post 1' } }),
      ])

      await payload.delete({
        collection: 'posts',
        id: post1.id,
      })

      const afterDelete = await restClient
        .GRAPHQL_POST({ body: JSON.stringify({ query }) })
        .then((res) => res.json())

      expect(afterDelete.errors).toBeUndefined()
    })

    describe('recursive blocks', () => {
      it('should build a single self-referential type for recursive blocks sharing a slug', () => {
        // Before the fix this threw at schema construction:
        // "Schema must contain uniquely named types but contains multiple types
        // named "RecursiveItemBlock"." — one duplicate type per nesting level.
        const { schema } = configToSchema(payload.config)

        const blockType = schema.getType(recursiveBlockInterfaceName) as GraphQLObjectType

        expect(blockType).toBeDefined()

        const childrenUnion = getNamedType(blockType.getFields().children!.type) as GraphQLUnionType

        // The nested `children` union must reference the exact same type object,
        // not a duplicate created while re-entering the blocks field handler.
        expect(childrenUnion.getTypes()).toContain(blockType)
      })

      it('should query nested recursive blocks through GraphQL', async () => {
        const post = await payload.create({
          collection: 'posts',
          data: {
            recursiveBlockField: [
              {
                blockType: 'recursiveItem',
                children: [
                  {
                    blockType: 'recursiveItem',
                    children: [
                      {
                        blockType: 'recursiveItem',
                        label: 'level-3',
                      },
                    ],
                    label: 'level-2',
                  },
                ],
                label: 'level-1',
              },
            ],
            title: 'Post with recursive blocks',
          },
        })

        const query = `query {
          Post(id: ${idToString(post.id, payload)}) {
            recursiveBlockField {
              ... on ${recursiveBlockInterfaceName} {
                label
                children {
                  ... on ${recursiveBlockInterfaceName} {
                    label
                    children {
                      ... on ${recursiveBlockInterfaceName} {
                        label
                      }
                    }
                  }
                }
              }
            }
          }
        }`

        const response = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query }) })
          .then((res) => res.json())

        expect(response.errors).toBeFalsy()

        const [root] = response.data.Post.recursiveBlockField

        expect(root.label).toBe('level-1')
        expect(root.children[0].label).toBe('level-2')
        expect(root.children[0].children[0].label).toBe('level-3')

        await payload.delete({
          collection: 'posts',
          id: post.id,
        })
      })
    })

    describe('nullable schema types', () => {
      it('should not mark required virtual fields as non-null in the mutation input type', () => {
        const { schema } = configToSchema(payload.config)
        const inputType = schema.getType('mutationVirtualFieldInput') as GraphQLInputObjectType
        const fields = inputType.getFields()

        expect(fields.requiredTitle!.type instanceof GraphQLNonNull).toBe(true)
        expect(fields.virtualComputed!.type instanceof GraphQLNonNull).toBe(false)
        expect(fields.virtualFromRelation!.type instanceof GraphQLNonNull).toBe(false)
      })
    })
  })
})
