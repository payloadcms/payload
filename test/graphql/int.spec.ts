import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { idToString } from '../__helpers/shared/idToString.js'
import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'

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
  })
})
