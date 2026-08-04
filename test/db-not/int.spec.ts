import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { categoriesSlug, postsSlug } from './config.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let payload: Payload
let restClient: NextRESTClient

describe('db-not', () => {
  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(dirname))
  })

  afterAll(async () => {
    await payload.destroy()
  })

  it('should support not operator', async () => {
    await payload.create({
      collection: postsSlug,
      data: { title: 'post1', description: 'desc1' },
    })
    await payload.create({
      collection: postsSlug,
      data: { title: 'post2', description: 'desc2' },
    })
    await payload.create({
      collection: postsSlug,
      data: { title: 'post3', description: 'desc3' },
    })

    const { docs } = await payload.find({
      collection: postsSlug,
      where: {
        not: {
          title: {
            equals: 'post1',
          },
        },
      },
    })

    expect(docs).toHaveLength(2)
    const titles = docs.map((d) => d.title)
    expect(titles).toContain('post2')
    expect(titles).toContain('post3')
    expect(titles).not.toContain('post1')
  })

  it('should support nested not in and', async () => {
    const { docs } = await payload.find({
      collection: postsSlug,
      where: {
        and: [
          {
            title: {
              equals: 'post1',
            },
          },
          {
            not: {
              description: {
                equals: 'desc1',
              },
            },
          },
        ],
      },
    })

    expect(docs).toHaveLength(0)

    const { docs: docs2 } = await payload.find({
      collection: postsSlug,
      where: {
        and: [
          {
            title: {
              equals: 'post1',
            },
          },
          {
            not: {
              description: {
                equals: 'desc2',
              },
            },
          },
        ],
      },
    })

    expect(docs2).toHaveLength(1)
    expect(docs2[0].title).toBe('post1')
  })

  it('should support not with and inside', async () => {
    const { docs } = await payload.find({
      collection: postsSlug,
      where: {
        not: {
          and: [
            {
              title: {
                equals: 'post1',
              },
            },
            {
              description: {
                equals: 'desc1',
              },
            },
          ],
        },
      },
    })

    expect(docs).toHaveLength(2)
    const titles = docs.map((d) => d.title)
    expect(titles).toContain('post2')
    expect(titles).toContain('post3')
    expect(titles).not.toContain('post1')
  })

  it('should support double not', async () => {
    const { docs } = await payload.find({
      collection: postsSlug,
      where: {
        not: {
          not: {
            title: {
              equals: 'post1',
            },
          },
        },
      },
    })

    expect(docs).toHaveLength(1)
    expect(docs[0].title).toBe('post1')
  })

  it('should support not operator via REST', async () => {
    const response = await restClient
      .GET(`/${postsSlug}`, {
        query: {
          where: {
            not: {
              title: {
                equals: 'post1',
              },
            },
          },
        },
      })
      .then((res) => res.json())

    expect(response.docs).toHaveLength(2)
    const titles = response.docs.map((d: any) => d.title)
    expect(titles).toContain('post2')
    expect(titles).toContain('post3')
    expect(titles).not.toContain('post1')
  })

  it('should support not operator via GraphQL', async () => {
    const query = `query {
      Posts(where: {
        NOT: {
          title: {
            equals: "post1"
          }
        }
      }) {
        docs {
          title
        }
      }
    }`

    const response: any = await restClient
      .GRAPHQL_POST({
        body: JSON.stringify({ query }),
      })
      .then((res) => res.json())

    expect(response.errors).toBeUndefined()

    const docs = response.data.Posts.docs
    expect(docs).toHaveLength(2)
    const titles = docs.map((d: any) => d.title)
    expect(titles).toContain('post2')
    expect(titles).toContain('post3')
    expect(titles).not.toContain('post1')
  })

  it('should support not operator with relationships', async () => {
    const cat1 = await payload.create({
      collection: categoriesSlug,
      data: { name: 'cat1' },
    })
    const cat2 = await payload.create({
      collection: categoriesSlug,
      data: { name: 'cat2' },
    })

    await payload.create({
      collection: postsSlug,
      data: { title: 'rel-post1', category: cat1.id },
    })
    await payload.create({
      collection: postsSlug,
      data: { title: 'rel-post2', category: cat2.id },
    })

    const { docs } = await payload.find({
      collection: postsSlug,
      where: {
        not: {
          category: {
            equals: cat1.id,
          },
        },
      },
    })

    const titles = docs.map((d) => d.title)
    expect(titles).not.toContain('rel-post1')
    expect(titles).toContain('rel-post2')
  })

  it('should support not operator with nested relationship properties', async () => {
    const { docs } = await payload.find({
      collection: postsSlug,
      where: {
        not: {
          'category.name': {
            equals: 'cat1',
          },
        },
      },
    })

    const titles = docs.map((d) => d.title)
    expect(titles).not.toContain('rel-post1')
    expect(titles).toContain('rel-post2')
  })
})
