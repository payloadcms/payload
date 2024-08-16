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

    for (let i = 0; i < 10; i++) {
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
        posts: {
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

  it('should populate joins using find', async () => {
    const result = await payload.find({
      collection: 'categories',
    })

    const [categoryWithPosts] = result.docs

    expect(categoryWithPosts.group.posts.docs).toHaveLength(10)
    expect(categoryWithPosts.group.posts.docs[0]).toHaveProperty('title')
    expect(categoryWithPosts.group.posts.docs[0].title).toBe('test 9')
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
          title: 'english post',
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
          title: 'spanish post',
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
    it('should paginate joins', async () => {
      let page = 1
      const query = {
        depth: 1,
        where: {
          name: { equals: 'paginate example' },
        },
        joins: {
          posts: {
            limit: 4,
            sort: 'createdAt',
            get page() {
              return page
            },
          },
        },
      }

      const page1 = await restClient.GET(`/categories`, { query }).then((res) => res.json())
      page = 2
      const page2 = await restClient.GET(`/categories`, { query }).then((res) => res.json())
      page = 3
      const page3 = await restClient.GET(`/categories`, { query }).then((res) => res.json())

      expect(page1.docs[0].posts.docs).toHaveLength(4)
      expect(page1.docs[0].posts.docs[0].title).toStrictEqual('test 0')
      expect(page1.docs[0].posts.hasNextPage).toStrictEqual(true)
      expect(page1.docs[0].posts.hasPrevPage).toStrictEqual(false)
      expect(page1.docs[0].posts.limit).toStrictEqual(4)
      expect(page1.docs[0].posts.nextPage).toStrictEqual(2)
      expect(page1.docs[0].posts.page).toStrictEqual(1)
      expect(page1.docs[0].posts.pagingCounter).toStrictEqual(1)
      expect(page1.docs[0].posts.prevPage).toStrictEqual(null)
      expect(page1.docs[0].posts.totalDocs).toStrictEqual(10)
      expect(page1.docs[0].posts.totalPages).toStrictEqual(3)

      expect(page2.docs[0].posts.docs).toHaveLength(4)
      expect(page2.docs[0].posts.docs[0].title).toStrictEqual('test 4')
      expect(page2.docs[0].posts.hasNextPage).toStrictEqual(true)
      expect(page2.docs[0].posts.hasPrevPage).toStrictEqual(true)
      expect(page2.docs[0].posts.limit).toStrictEqual(4)
      expect(page2.docs[0].posts.nextPage).toStrictEqual(3)
      expect(page2.docs[0].posts.page).toStrictEqual(2)
      expect(page2.docs[0].posts.pagingCounter).toStrictEqual(5)
      expect(page2.docs[0].posts.prevPage).toStrictEqual(1)
      expect(page2.docs[0].posts.totalDocs).toStrictEqual(10)
      expect(page2.docs[0].posts.totalPages).toStrictEqual(3)

      expect(page3.docs[0].posts.docs).toHaveLength(2)
      expect(page3.docs[0].posts.docs[0].title).toStrictEqual('test 8')
      expect(page3.docs[0].posts.hasNextPage).toStrictEqual(false)
      expect(page3.docs[0].posts.hasPrevPage).toStrictEqual(true)
      expect(page3.docs[0].posts.limit).toStrictEqual(4)
      expect(page3.docs[0].posts.nextPage).toStrictEqual(null)
      expect(page3.docs[0].posts.page).toStrictEqual(3)
      expect(page3.docs[0].posts.pagingCounter).toStrictEqual(9)
      expect(page3.docs[0].posts.prevPage).toStrictEqual(2)
      expect(page3.docs[0].posts.totalDocs).toStrictEqual(10)
      expect(page3.docs[0].posts.totalPages).toStrictEqual(3)
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
