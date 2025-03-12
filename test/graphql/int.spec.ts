import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import type { NextRESTClient } from '../helpers/NextRESTClient.js'

import { idToString } from '../helpers/idToString.js'
import { initPayloadInt } from '../helpers/initPayloadInt.js'

let payload: Payload
let restClient: NextRESTClient

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('graphql', () => {
  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(dirname))
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
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

    it('should leverage expected amount of operations per query', async () => {
      const query = `query pageTypeBySlug($slug: String!, $draft: Boolean = false) {
    Posts(where: { slug: { equals: $slug } }, draft: $draft) {
      docs {
        id
      }
    }
    Posts2s(where: { slug: { equals: $slug } }, draft: $draft) {
      docs {
        id
      }
    }
    Posts3s(where: { slug: { equals: $slug } }, draft: $draft) {
      docs {
        id
      }
    }
    Posts4s(where: { slug: { equals: $slug } }, draft: $draft) {
      docs {
        id
      }
    }
    Posts5s(where: { slug: { equals: $slug } }, draft: $draft) {
      docs {
        id
      }
    }
  	Posts6s(where: { slug: { equals: $slug } }, draft: $draft) {
      docs {
        id
      }
    }
  }`

      const { data } = await restClient
        .GRAPHQL_POST({ body: JSON.stringify({ query, variables: { slug: 'hello' } }) })
        .then((res) => res.json())

      expect(data.Posts.docs).toBeDefined()
      expect(data.Posts2s.docs).toBeDefined()
      expect(data.Posts3s.docs).toBeDefined()
      expect(data.Posts4s.docs).toBeDefined()
      expect(data.Posts5s.docs).toBeDefined()
      expect(data.Posts6s.docs).toBeDefined()
    })
  })
})
