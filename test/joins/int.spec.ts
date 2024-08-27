import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import type { NextRESTClient } from '../helpers/NextRESTClient.js'
import type { Category, Post } from './payload-types.js'

import { devUser } from '../credentials.js'
import { initPayloadInt } from '../helpers/initPayloadInt.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

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
    ;({ payload, restClient } = await initPayloadInt(dirname))

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
        name: 'paginate example',
        group: {},
      },
    })

    for (let i = 0; i < 15; i++) {
      await createPost({
        title: `test ${i}`,
        category: category.id,
        group: {
          category: category.id,
        },
      })
    }
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
  })

  it('should populate joins using findByID', async () => {
    const categoryWithPosts = await payload.findByID({
      id: category.id,
      joins: {
        'group.posts': {
          sort: '-title',
        },
      },
      collection: 'categories',
    })

    expect(categoryWithPosts.group.posts.docs).toHaveLength(10)
    expect(categoryWithPosts.group.posts.docs[0]).toHaveProperty('id')
    expect(categoryWithPosts.group.posts.docs[0]).toHaveProperty('title')
    expect(categoryWithPosts.group.posts.docs[0].title).toStrictEqual('test 9')
  })

  it('should filter joins using where query', async () => {
    const categoryWithPosts = await payload.findByID({
      id: category.id,
      joins: {
        posts: {
          sort: '-title',
          where: {
            title: {
              equals: 'test 9',
            },
          },
        },
      },
      collection: 'categories',
    })

    expect(categoryWithPosts.posts.docs).toHaveLength(1)
    expect(categoryWithPosts.posts.hasNextPage).toStrictEqual(false)
  })

  it('should populate joins using find', async () => {
    const result = await payload.find({
      collection: 'categories',
    })

    const [categoryWithPosts] = result.docs

    expect(categoryWithPosts.group.posts.docs).toHaveLength(10)
    expect(categoryWithPosts.group.posts.docs[0]).toHaveProperty('title')
    expect(categoryWithPosts.group.posts.docs[0].title).toBe('test 14')
  })

  describe('Joins with localization', () => {
    let localizedCategory: Category

    beforeAll(async () => {
      localizedCategory = await payload.create({
        collection: 'localized-categories',
        locale: 'en',
        data: {
          name: 'localized category',
        },
      })
      const post1 = await payload.create({
        collection: 'localized-posts',
        locale: 'en',
        data: {
          title: 'english post 1',
          category: localizedCategory.id,
        },
      })
      await payload.update({
        collection: 'localized-posts',
        id: post1.id,
        locale: 'es',
        data: {
          title: 'spanish post',
          category: localizedCategory.id,
        },
      })
      await payload.create({
        collection: 'localized-posts',
        locale: 'en',
        data: {
          title: 'english post 2',
          category: localizedCategory.id,
        },
      })
    })

    it('should populate joins using findByID with localization on the relationship', async () => {
      const enCategory = await payload.findByID({
        id: localizedCategory.id,
        collection: 'localized-categories',
        locale: 'en',
      })
      const esCategory = await payload.findByID({
        id: localizedCategory.id,
        collection: 'localized-categories',
        locale: 'es',
      })
      expect(enCategory.posts.docs).toHaveLength(2)
      expect(esCategory.posts.docs).toHaveLength(1)
    })
  })

  describe('REST', () => {
    it('should have simple paginate for joins', async () => {
      const query = {
        depth: 1,
        where: {
          name: { equals: 'paginate example' },
        },
        joins: {
          posts: {
            sort: 'createdAt',
            limit: 4,
          },
        },
      }
      const pageWithLimit = await restClient.GET(`/categories`, { query }).then((res) => res.json())

      query.joins.posts.limit = 0
      const unlimited = await restClient.GET(`/categories`, { query }).then((res) => res.json())

      expect(pageWithLimit.docs[0].posts.docs).toHaveLength(4)
      expect(pageWithLimit.docs[0].posts.docs[0].title).toStrictEqual('test 0')
      expect(pageWithLimit.docs[0].posts.hasNextPage).toStrictEqual(true)

      expect(unlimited.docs[0].posts.docs).toHaveLength(15)
      expect(unlimited.docs[0].posts.docs[0].title).toStrictEqual('test 0')
      expect(unlimited.docs[0].posts.hasNextPage).toStrictEqual(false)
    })
    it('should sort joins', async () => {
      const response = await restClient
        .GET(`/categories/${category.id}?joins[posts][sort]=-title`)
        .then((res) => res.json())
      expect(response.posts.docs[0].title).toStrictEqual('test 9')
    })
  })
})

async function createPost(overrides?: Partial<Post>) {
  return payload.create({
    collection: 'posts',
    data: {
      title: 'test',
      ...overrides,
    },
  })
}
