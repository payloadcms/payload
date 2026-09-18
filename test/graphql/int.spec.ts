import type { GraphQLInputObjectType } from 'graphql'

import { configToSchema } from '@payloadcms/graphql'
import { GraphQLNonNull } from 'graphql'
import { fileURLToPath } from 'url'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { idToString } from '../__helpers/shared/idToString.js'

test.suite({ config: './config.ts' })('graphql', () => {
  test.describe('graphql', () => {
    test('should return 404 when GraphQL is disabled', async ({ payload, restClient }) => {
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

    test('should not be able to query introspection', async ({ restClient }) => {
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

    test('should respect maxComplexity', async ({ payload, restClient }) => {
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

    test('should sanitize hyphenated field names to snake case', async ({
      payload,
      restClient,
    }) => {
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

    test('should not error because of non nullable fields', async ({ payload, restClient }) => {
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

    test('should handle blocks with select: true', async ({ payload, restClient }) => {
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

    test('should not error when querying a global with a deleted relationship in an array', async ({
      payload,
      restClient,
    }) => {
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

    test.describe('nullable schema types', () => {
      test('should not mark required virtual fields as non-null in the mutation input type', ({
        payload,
      }) => {
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
