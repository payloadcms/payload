import type { Payload } from 'payload'

import type { NextRESTClient } from '../helpers/NextRESTClient.js'
import type { Category } from './payload-types.js'

import { devUser } from '../credentials.js'
import { initPayloadInt } from '../helpers/initPayloadInt.js'
import configPromise from './config.js'

let payload: Payload
let token: string
let restClient: NextRESTClient

const { email, password } = devUser

describe('Joins Field Tests', () => {
  let category: Category
  // --__--__--__--__--__--__--__--__--__
  // Boilerplate test setup/teardown
  // --__--__--__--__--__--__--__--__--__
  beforeAll(async () => {
    const initialized = await initPayloadInt(configPromise)
    ;({ payload, restClient } = initialized)

    const data = await restClient
      .POST('/users/login', {
        body: JSON.stringify({
          email,
          password,
        }),
      })
      .then((res) => res.json())

    token = data.token

    category = await payload.create({
      collection: 'categories',
      data: {
        name: 'example',
        group: {},
      },
    })

    await payload.create({
      collection: 'posts',
      data: {
        category: category.id,
        group: {
          category: category.id,
        },
        title: 'test a',
      },
    })
    await payload.create({
      collection: 'posts',
      data: {
        category: category.id,
        group: {
          category: category.id,
        },
        title: 'test b',
      },
    })
    await payload.create({
      collection: 'posts',
      data: {
        category: category.id,
        group: {
          category: category.id,
        },
        title: 'test c',
      },
    })
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
  })

  it('should populate joins using findByID', async () => {
    const categoryWithPosts = await payload.findByID({
      id: category.id,
      collection: 'categories',
    })

    expect(Array.isArray(categoryWithPosts.group.posts)).toBeDefined()
    expect(Array.isArray(categoryWithPosts.posts)).toBeDefined()
    const joinedIDs = categoryWithPosts.group.posts.map((post) => post.id)

    expect(categoryWithPosts.group.posts).toHaveLength(3)
    expect(categoryWithPosts.group.posts[0]).toHaveProperty('title')
    expect(categoryWithPosts.group.posts[0].title).toBe('test a')
    expect(joinedIDs).toContain(categoryWithPosts.group.posts[0].id)
    expect(joinedIDs).toContain(categoryWithPosts.group.posts[1].id)
    expect(joinedIDs).toContain(categoryWithPosts.group.posts[2].id)
  })

  it('should populate joins using find', async () => {
    const result = await payload.find({
      collection: 'categories',
    })

    const [categoryWithPosts] = result.docs

    expect(Array.isArray(categoryWithPosts.group.posts)).toBeDefined()
    expect(Array.isArray(categoryWithPosts.posts)).toBeDefined()
    const joinedIDs = categoryWithPosts.group.posts.map((post) => post.id)

    expect(categoryWithPosts.group.posts).toHaveLength(3)
    expect(categoryWithPosts.group.posts[0]).toHaveProperty('title')
    expect(categoryWithPosts.group.posts[0].title).toBe('test a')
    expect(joinedIDs).toContain(categoryWithPosts.group.posts[0].id)
    expect(joinedIDs).toContain(categoryWithPosts.group.posts[1].id)
    expect(joinedIDs).toContain(categoryWithPosts.group.posts[2].id)
  })

  describe('REST', () => {
    it('should paginate joins', async () => {
      const response = await restClient
        .GET(`/categories/${category.id}?joins[posts][limit]=1[page]=2`)
        .then((res) => res.json())
      expect(response.posts).toHaveLength(1)
      expect(response.posts[0].title).toStrictEqual('test b')
    })
    it('should sort joins', async () => {
      const response = await restClient
        .GET(`/categories/${category.id}?joins[posts][sort]=-title`)
        .then((res) => res.json())
      expect(response.posts[0].title).toStrictEqual('test c')
    })
  })
})
