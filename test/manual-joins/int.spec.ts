import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import type { Category } from './payload-types.js'

import { devUser } from '../credentials.js'
import { initPayloadInt } from '../helpers/initPayloadInt.js'

let payload: Payload

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('Manual Joins', () => {
  beforeAll(async () => {
    process.env.PAYLOAD_MANUAL_JOINS = 'true'
    ;({ payload } = await initPayloadInt(dirname))
  })

  afterAll(async () => {
    await payload.destroy()
  })

  it('should populate join field using manual mode', async () => {
    await payload.login({
      collection: 'users',
      data: { email: 'test@example.com', password: 'test' },
    })
    const [category] = await payload
      .find({ collection: 'categories', limit: 1 })
      .then((r) => r.docs)
    const result = (await payload.findByID({
      collection: 'categories',
      id: category.id,
      joins: { posts: { sort: '-title' } },
    })) as Category
    expect(result.posts.docs).toHaveLength(10)
    expect(result.posts.docs[0].title).toBe('test 9')
    expect(result.posts.hasNextPage).toBe(true)
  })

  it('supports custom pagination and count', async () => {
    const [category] = await payload
      .find({ collection: 'categories', limit: 1 })
      .then((r) => r.docs)
    const result = (await payload.findByID({
      collection: 'categories',
      id: category.id,
      joins: { posts: { limit: 5, page: 3, count: true, sort: '-title' } },
    })) as Category & { posts: { docs: Record<string, string>[]; totalDocs: number; hasNextPage: boolean } }
    expect(result.posts.docs[0].title).toBe('test 12')
    expect(result.posts.docs).toHaveLength(5)
    expect(result.posts.totalDocs).toBe(15)
    expect(result.posts.hasNextPage).toBe(false)
  })

  it('should resolve joins via find', async () => {
    const result = await payload.find({
      collection: 'categories',
      limit: 1,
      joins: { posts: { limit: 3 } },
    })
    const category = result.docs[0] as Category
    expect(category.posts.docs).toHaveLength(3)
    expect(typeof category.posts.hasNextPage).toBe('boolean')
  })

  it('should ignore unknown join paths', async () => {
    const [category] = await payload
      .find({ collection: 'categories', limit: 1 })
      .then((r) => r.docs)
    const result = (await payload.findByID({
      collection: 'categories',
      id: category.id,
      joins: { notReal: {} },
    })) as Category
    expect(result.posts).toBeUndefined()
  })

  it('should return undefined when joins disabled', async () => {
    const [category] = await payload
      .find({ collection: 'categories', limit: 1 })
      .then((r) => r.docs)
    const result = (await payload.findByID({
      collection: 'categories',
      id: category.id,
      joins: false,
    })) as Category
    expect(result.posts).toBeUndefined()
  })
})
