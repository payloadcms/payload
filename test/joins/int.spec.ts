import type { Payload } from 'payload'

import path from 'path'
import { getFileByPath } from 'payload'
import { fileURLToPath } from 'url'

import type { NextRESTClient } from '../helpers/NextRESTClient.js'
import type { Category, Config, Post } from './payload-types.js'

import { devUser } from '../credentials.js'
import { idToString } from '../helpers/idToString.js'
import { initPayloadInt } from '../helpers/initPayloadInt.js'
import { categoriesSlug, uploadsSlug } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let payload: Payload
let token: string
let restClient: NextRESTClient

const { email, password } = devUser

describe('Joins Field', () => {
  let category: Category
  let otherCategory: Category
  let categoryID
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
      collection: categoriesSlug,
      data: {
        name: 'paginate example',
        group: {},
      },
    })

    otherCategory = await payload.create({
      collection: categoriesSlug,
      data: {
        name: 'otherCategory',
        group: {},
      },
    })

    // create an upload
    const imageFilePath = path.resolve(dirname, './image.png')
    const imageFile = await getFileByPath(imageFilePath)

    const { id: uploadedImage } = await payload.create({
      collection: uploadsSlug,
      data: {},
      file: imageFile,
    })

    categoryID = idToString(category.id, payload)

    for (let i = 0; i < 15; i++) {
      let categories = [category.id]
      if (i % 2 === 0) {
        categories = [category.id, otherCategory.id]
      }
      await createPost({
        title: `test ${i}`,
        category: category.id,
        upload: uploadedImage,
        categories,
        categoriesLocalized: categories,
        group: {
          category: category.id,
          camelCaseCategory: category.id,
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
        'group.relatedPosts': {
          sort: '-title',
        },
      },
      collection: 'categories',
    })
    // const sortCategoryWithPosts = await payload.findByID({
    //   id: category.id,
    //   joins: {
    //     'group.relatedPosts': {
    //       sort: 'title',
    //     },
    //   },
    //   collection: 'categories',
    // })

    expect(categoryWithPosts.group.relatedPosts.docs).toHaveLength(10)
    expect(categoryWithPosts.group.relatedPosts.docs[0]).toHaveProperty('id')
    expect(categoryWithPosts.group.relatedPosts.docs[0]).toHaveProperty('title')
    expect(categoryWithPosts.group.relatedPosts.docs[0].title).toStrictEqual('test 9')
  })

  it('should populate relationships in joins', async () => {
    const { docs } = await payload.find({
      limit: 1,
      collection: 'posts',
    })

    expect(docs[0].category.id).toBeDefined()
    expect(docs[0].category.name).toBeDefined()
    expect(docs[0].category.relatedPosts.docs).toHaveLength(10)
  })

  it('should populate relationships in joins with camelCase names', async () => {
    const { docs } = await payload.find({
      limit: 1,
      collection: 'posts',
    })

    expect(docs[0].group.camelCaseCategory.id).toBeDefined()
    expect(docs[0].group.camelCaseCategory.name).toBeDefined()
    expect(docs[0].group.camelCaseCategory.group.camelCasePosts.docs).toHaveLength(10)
  })

  it('should populate uploads in joins', async () => {
    const { docs } = await payload.find({
      limit: 1,
      collection: 'posts',
    })

    expect(docs[0].upload.id).toBeDefined()
    expect(docs[0].upload.relatedPosts.docs).toHaveLength(10)
  })

  it('should filter joins using where query', async () => {
    const categoryWithPosts = await payload.findByID({
      id: category.id,
      joins: {
        relatedPosts: {
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

    expect(categoryWithPosts.relatedPosts.docs).toHaveLength(1)
    expect(categoryWithPosts.relatedPosts.hasNextPage).toStrictEqual(false)
  })

  it('should populate joins using find', async () => {
    const result = await payload.find({
      collection: 'categories',
      where: {
        id: { equals: category.id },
      },
    })

    const [categoryWithPosts] = result.docs

    expect(categoryWithPosts.group.relatedPosts.docs).toHaveLength(10)
    expect(categoryWithPosts.group.relatedPosts.docs[0]).toHaveProperty('title')
    expect(categoryWithPosts.group.relatedPosts.docs[0].title).toBe('test 14')
  })

  it('should populate joins using find with hasMany relationships', async () => {
    const result = await payload.find({
      collection: 'categories',
      where: {
        id: { equals: category.id },
      },
    })
    const otherResult = await payload.find({
      collection: 'categories',
      where: {
        id: { equals: otherCategory.id },
      },
    })

    const [categoryWithPosts] = result.docs
    const [otherCategoryWithPosts] = otherResult.docs

    expect(categoryWithPosts.hasManyPosts.docs).toHaveLength(10)
    expect(categoryWithPosts.hasManyPosts.docs[0]).toHaveProperty('title')
    expect(categoryWithPosts.hasManyPosts.docs[0].title).toBe('test 14')
    expect(otherCategoryWithPosts.hasManyPosts.docs).toHaveLength(8)
    expect(otherCategoryWithPosts.hasManyPosts.docs[0]).toHaveProperty('title')
    expect(otherCategoryWithPosts.hasManyPosts.docs[0].title).toBe('test 14')
  })

  it('should populate joins using find with hasMany localized relationships', async () => {
    const post_1 = await createPost(
      {
        title: `test es localized 1`,
        categoriesLocalized: [category.id],
        group: {
          category: category.id,
          camelCaseCategory: category.id,
        },
      },
      'es',
    )

    const post_2 = await createPost(
      {
        title: `test es localized 2`,
        categoriesLocalized: [otherCategory.id],
        group: {
          category: category.id,
          camelCaseCategory: category.id,
        },
      },
      'es',
    )

    const resultEn = await payload.find({
      collection: 'categories',
      where: {
        id: { equals: category.id },
      },
    })
    const otherResultEn = await payload.find({
      collection: 'categories',
      where: {
        id: { equals: otherCategory.id },
      },
    })

    const [categoryWithPostsEn] = resultEn.docs
    const [otherCategoryWithPostsEn] = otherResultEn.docs

    expect(categoryWithPostsEn.hasManyPostsLocalized.docs).toHaveLength(10)
    expect(categoryWithPostsEn.hasManyPostsLocalized.docs[0]).toHaveProperty('title')
    expect(categoryWithPostsEn.hasManyPostsLocalized.docs[0].title).toBe('test 14')
    expect(otherCategoryWithPostsEn.hasManyPostsLocalized.docs).toHaveLength(8)
    expect(otherCategoryWithPostsEn.hasManyPostsLocalized.docs[0]).toHaveProperty('title')
    expect(otherCategoryWithPostsEn.hasManyPostsLocalized.docs[0].title).toBe('test 14')

    const resultEs = await payload.find({
      collection: 'categories',
      locale: 'es',
      where: {
        id: { equals: category.id },
      },
    })
    const otherResultEs = await payload.find({
      collection: 'categories',
      locale: 'es',
      where: {
        id: { equals: otherCategory.id },
      },
    })

    const [categoryWithPostsEs] = resultEs.docs
    const [otherCategoryWithPostsEs] = otherResultEs.docs

    expect(categoryWithPostsEs.hasManyPostsLocalized.docs).toHaveLength(1)
    expect(categoryWithPostsEs.hasManyPostsLocalized.docs[0].title).toBe('test es localized 1')

    expect(otherCategoryWithPostsEs.hasManyPostsLocalized.docs).toHaveLength(1)
    expect(otherCategoryWithPostsEs.hasManyPostsLocalized.docs[0].title).toBe('test es localized 2')

    // clean up
    await payload.delete({
      collection: 'posts',
      where: {
        id: {
          in: [post_1.id, post_2.id],
        },
      },
    })
  })

  it('should not error when deleting documents with joins', async () => {
    const category = await payload.create({
      collection: 'categories',
      data: {
        name: 'category with post',
      },
    })

    const post = await createPost({
      category: category.id,
    })

    const result = await payload.delete({
      collection: 'categories',
      // id: category.id,
      where: {
        id: { equals: category.id },
      },
    })

    expect(result.docs[0].id).toStrictEqual(category.id)
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
      expect(enCategory.relatedPosts.docs).toHaveLength(2)
      expect(esCategory.relatedPosts.docs).toHaveLength(1)
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
          relatedPosts: {
            sort: 'createdAt',
            limit: 4,
          },
        },
      }
      const pageWithLimit = await restClient.GET(`/categories`, { query }).then((res) => res.json())

      query.joins.relatedPosts.limit = 0
      const unlimited = await restClient.GET(`/categories`, { query }).then((res) => res.json())

      expect(pageWithLimit.docs[0].relatedPosts.docs).toHaveLength(4)
      expect(pageWithLimit.docs[0].relatedPosts.docs[0].title).toStrictEqual('test 0')
      expect(pageWithLimit.docs[0].relatedPosts.hasNextPage).toStrictEqual(true)

      expect(unlimited.docs[0].relatedPosts.docs).toHaveLength(15)
      expect(unlimited.docs[0].relatedPosts.docs[0].title).toStrictEqual('test 0')
      expect(unlimited.docs[0].relatedPosts.hasNextPage).toStrictEqual(false)
    })

    it('should sort joins', async () => {
      const response = await restClient
        .GET(`/categories/${category.id}?joins[relatedPosts][sort]=-title`)
        .then((res) => res.json())
      expect(response.relatedPosts.docs[0].title).toStrictEqual('test 9')
    })

    it('should query in on collections with joins', async () => {
      const response = await restClient
        .GET(`/categories?where[id][in]=${category.id}`)
        .then((res) => res.json())
      expect(response.docs[0].name).toStrictEqual(category.name)
    })
  })

  describe('GraphQL', () => {
    it('should have simple paginate for joins', async () => {
      const queryWithLimit = `query {
    Categories(where: {
            name: { equals: "paginate example" }
          }) {
          docs {
            relatedPosts(
              sort: "createdAt",
              limit: 4
            ) {
              docs {
                title
              }
              hasNextPage
            }
          }
        }
      }`
      const pageWithLimit = await restClient
        .GRAPHQL_POST({ body: JSON.stringify({ query: queryWithLimit }) })
        .then((res) => res.json())

      const queryUnlimited = `query {
        Categories(
          where: {
            name: { equals: "paginate example" }
          }
        ) {
          docs {
            relatedPosts(
              sort: "createdAt",
              limit: 0
            ) {
              docs {
                title
                createdAt
              }
              hasNextPage
            }
          }
        }
      }`

      const unlimited = await restClient
        .GRAPHQL_POST({ body: JSON.stringify({ query: queryUnlimited }) })
        .then((res) => res.json())

      expect(pageWithLimit.data.Categories.docs[0].relatedPosts.docs).toHaveLength(4)
      expect(pageWithLimit.data.Categories.docs[0].relatedPosts.docs[0].title).toStrictEqual(
        'test 0',
      )
      expect(pageWithLimit.data.Categories.docs[0].relatedPosts.hasNextPage).toStrictEqual(true)

      expect(unlimited.data.Categories.docs[0].relatedPosts.docs).toHaveLength(15)
      expect(unlimited.data.Categories.docs[0].relatedPosts.docs[0].title).toStrictEqual('test 0')
      expect(unlimited.data.Categories.docs[0].relatedPosts.hasNextPage).toStrictEqual(false)
    })

    it('should have simple paginate for joins inside groups', async () => {
      const queryWithLimit = `query {
    Categories(where: {
            name: { equals: "paginate example" }
          }) {
          docs {
            group {
              relatedPosts(
                sort: "createdAt",
                limit: 4
              ) {
                docs {
                  title
                }
                hasNextPage
              }
            }
          }
        }
      }`
      const pageWithLimit = await restClient
        .GRAPHQL_POST({ body: JSON.stringify({ query: queryWithLimit }) })
        .then((res) => res.json())

      const queryUnlimited = `query {
        Categories(
          where: {
            name: { equals: "paginate example" }
          }
        ) {
          docs {
            group {
              relatedPosts(
                sort: "createdAt",
                limit: 0
              ) {
                docs {
                  title
                }
                hasNextPage
              }
            }
          }
        }
      }`

      const unlimited = await restClient
        .GRAPHQL_POST({ body: JSON.stringify({ query: queryUnlimited }) })
        .then((res) => res.json())

      expect(pageWithLimit.data.Categories.docs[0].group.relatedPosts.docs).toHaveLength(4)
      expect(pageWithLimit.data.Categories.docs[0].group.relatedPosts.docs[0].title).toStrictEqual(
        'test 0',
      )
      expect(pageWithLimit.data.Categories.docs[0].group.relatedPosts.hasNextPage).toStrictEqual(
        true,
      )

      expect(unlimited.data.Categories.docs[0].group.relatedPosts.docs).toHaveLength(15)
      expect(unlimited.data.Categories.docs[0].group.relatedPosts.docs[0].title).toStrictEqual(
        'test 0',
      )
      expect(unlimited.data.Categories.docs[0].group.relatedPosts.hasNextPage).toStrictEqual(false)
    })

    it('should sort joins', async () => {
      const query = `query {
        Category(id: ${categoryID}) {
          relatedPosts(
            sort: "-title"
          ) {
            docs {
              title
            }
          }
        }
      }`

      const response = await restClient
        .GRAPHQL_POST({ body: JSON.stringify({ query }) })
        .then((res) => res.json())
      expect(response.data.Category.relatedPosts.docs[0].title).toStrictEqual('test 9')
    })

    it('should query in on collections with joins', async () => {
      const query = `query {
         Category(id: ${categoryID}) {
          relatedPosts(
            where: {
              title: {
                equals: "test 3"
              }
            }
          ) {
            docs {
              title
            }
          }
        }
      }`
      const response = await restClient
        .GRAPHQL_POST({ body: JSON.stringify({ query }) })
        .then((res) => res.json())
      expect(response.data.Category.relatedPosts.docs[0].title).toStrictEqual('test 3')
    })
  })
})

async function createPost(overrides?: Partial<Post>, locale?: Config['locale']) {
  return payload.create({
    collection: 'posts',
    locale,
    data: {
      title: 'test',
      ...overrides,
    },
  })
}
