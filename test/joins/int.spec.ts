import type { Payload } from 'payload'

import type { NextRESTClient } from '../helpers/NextRESTClient.js'

import { devUser } from '../credentials.js'
import { initPayloadInt } from '../helpers/initPayloadInt.js'
import configPromise from './config.js'

let payload: Payload
let token: string
let restClient: NextRESTClient

const { email, password } = devUser

describe('Joins Field Tests', () => {
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
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
  })

  it('should populate joins', async () => {
    const category = await payload.create({
      collection: 'categories',
      data: {
        name: 'example',
        group: {},
      },
    })

    const post1 = await payload.create({
      collection: 'posts',
      data: {
        category: category.id,
        group: {
          category: category.id,
        },
        title: 'test',
      },
    })
    const post2 = await payload.create({
      collection: 'posts',
      data: {
        category: category.id,
        group: {
          category: category.id,
        },
        title: 'test',
      },
    })
    const post3 = await payload.create({
      collection: 'posts',
      data: {
        category: category.id,
        group: {
          category: category.id,
        },
        title: 'test',
      },
    })

    const categoryWithPosts = await payload.findByID({
      id: category.id,
      collection: 'categories',
    })

    expect(Array.isArray(categoryWithPosts.group.posts)).toBeDefined()
    expect(Array.isArray(categoryWithPosts.posts)).toBeDefined()
    const joinedIDs = categoryWithPosts.group.posts.map((post) => post.id)

    expect(categoryWithPosts.group.posts).toHaveLength(3)
    expect(categoryWithPosts.group.posts[0]).toHaveProperty('title')
    expect(categoryWithPosts.group.posts[0].title).toBe('test')
    expect(joinedIDs).toContain(categoryWithPosts.group.posts[0].id)
    expect(joinedIDs).toContain(categoryWithPosts.group.posts[1].id)
    expect(joinedIDs).toContain(categoryWithPosts.group.posts[2].id)
  })
})
