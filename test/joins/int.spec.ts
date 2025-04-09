import type { Payload, TypeWithID } from 'payload'

import path from 'path'
import { getFileByPath } from 'payload'
import { fileURLToPath } from 'url'

import type { NextRESTClient } from '../helpers/NextRESTClient.js'
import type { Category, Config, DepthJoins1, DepthJoins3, Post, Singular } from './payload-types.js'

import { devUser } from '../credentials.js'
import { idToString } from '../helpers/idToString.js'
import { initPayloadInt } from '../helpers/initPayloadInt.js'
import {
  categoriesJoinRestrictedSlug,
  categoriesSlug,
  postsSlug,
  restrictedCategoriesSlug,
  restrictedPostsSlug,
  uploadsSlug,
} from './shared.js'

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
  let user
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
    user = data.user

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
        polymorphic: {
          relationTo: 'categories',
          value: category.id,
        },
        polymorphics: [
          {
            relationTo: 'categories',
            value: category.id,
          },
        ],
        localizedPolymorphic: {
          relationTo: 'categories',
          value: category.id,
        },
        localizedPolymorphics: [
          {
            relationTo: 'categories',
            value: category.id,
          },
        ],
        group: {
          category: category.id,
          camelCaseCategory: category.id,
        },
        array: [{ category: category.id }],
        localizedArray: [{ category: category.id }],
        blocks: [{ blockType: 'block', category: category.id }],
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
      collection: categoriesSlug,
    })

    expect(categoryWithPosts.group.relatedPosts.docs).toHaveLength(10)
    expect(categoryWithPosts.group.relatedPosts.docs[0]).toHaveProperty('id')
    expect(categoryWithPosts.group.relatedPosts.docs[0]).toHaveProperty('title')
    expect(categoryWithPosts.group.relatedPosts.docs[0].title).toStrictEqual('test 9')
  })

  it('should not populate joins if not selected', async () => {
    const categoryWithPosts = await payload.findByID({
      id: category.id,
      joins: {
        'group.relatedPosts': {
          sort: '-title',
        },
      },
      select: {},
      collection: categoriesSlug,
    })

    expect(Object.keys(categoryWithPosts)).toStrictEqual(['id'])
  })

  it('should populate joins if selected', async () => {
    const categoryWithPosts = await payload.findByID({
      id: category.id,
      joins: {
        'group.relatedPosts': {
          sort: '-title',
        },
      },
      select: {
        group: {
          relatedPosts: true,
        },
      },
      collection: categoriesSlug,
    })

    expect(categoryWithPosts).toStrictEqual({
      id: categoryWithPosts.id,
      group: categoryWithPosts.group,
    })

    expect(categoryWithPosts.group.relatedPosts.docs).toHaveLength(10)
    expect(categoryWithPosts.group.relatedPosts.docs[0]).toHaveProperty('id')
    expect(categoryWithPosts.group.relatedPosts.docs[0]).toHaveProperty('title')
    expect(categoryWithPosts.group.relatedPosts.docs[0].title).toStrictEqual('test 9')
  })

  it('should count joins', async () => {
    let categoryWithPosts = await payload.findByID({
      id: category.id,
      joins: {
        'group.relatedPosts': {
          sort: '-title',
          count: true,
        },
      },
      collection: categoriesSlug,
    })

    expect(categoryWithPosts.group.relatedPosts?.totalDocs).toBe(15)

    // With limit 1
    categoryWithPosts = await payload.findByID({
      id: category.id,
      joins: {
        'group.relatedPosts': {
          sort: '-title',
          count: true,
          limit: 1,
        },
      },
      collection: categoriesSlug,
    })

    expect(categoryWithPosts.group.relatedPosts?.totalDocs).toBe(15)
  })

  it('should populate relationships in joins', async () => {
    const { docs } = await payload.find({
      limit: 1,
      collection: postsSlug,
      depth: 2,
    })

    expect(docs[0].category.id).toBeDefined()
    expect(docs[0].category.name).toBeDefined()
    expect(docs[0].category.relatedPosts.docs).toHaveLength(5) // uses defaultLimit
  })

  it('should populate relationships in joins with camelCase names', async () => {
    const { docs } = await payload.find({
      limit: 1,
      collection: postsSlug,
    })

    expect(docs[0].group.camelCaseCategory.id).toBeDefined()
    expect(docs[0].group.camelCaseCategory.name).toBeDefined()
    expect(docs[0].group.camelCaseCategory.group.camelCasePosts.docs).toHaveLength(10)
  })

  it('should populate joins with array relationships', async () => {
    const categoryWithPosts = await payload.findByID({
      id: category.id,
      collection: categoriesSlug,
    })

    expect(categoryWithPosts.arrayPosts.docs).toBeDefined()
    expect(categoryWithPosts.arrayPosts.docs).toHaveLength(10)
  })

  it('should populate joins with localized array relationships', async () => {
    const categoryWithPosts = await payload.findByID({
      id: category.id,
      collection: categoriesSlug,
    })

    expect(categoryWithPosts.localizedArrayPosts.docs).toBeDefined()
    expect(categoryWithPosts.localizedArrayPosts.docs).toHaveLength(10)
  })

  it('should populate joins with blocks relationships', async () => {
    const categoryWithPosts = await payload.findByID({
      id: category.id,
      collection: categoriesSlug,
    })

    expect(categoryWithPosts.blocksPosts.docs).toBeDefined()
  })

  it('should populate uploads in joins', async () => {
    const { docs } = await payload.find({
      limit: 1,
      collection: postsSlug,
    })

    expect(docs[0].upload.id).toBeDefined()
    expect(docs[0].upload.relatedPosts.docs).toHaveLength(10)
  })

  it('should join on polymorphic relationships', async () => {
    const categoryWithPosts = await payload.findByID({
      collection: categoriesSlug,
      id: category.id,
    })
    expect(categoryWithPosts.polymorphic.docs[0]).toHaveProperty('id')
    expect(categoryWithPosts.polymorphics.docs[0]).toHaveProperty('id')
    expect(categoryWithPosts.localizedPolymorphic.docs[0]).toHaveProperty('id')
    expect(categoryWithPosts.localizedPolymorphics.docs[0]).toHaveProperty('id')
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
      collection: categoriesSlug,
    })

    expect(categoryWithPosts.relatedPosts.docs).toHaveLength(1)
    expect(categoryWithPosts.relatedPosts.hasNextPage).toStrictEqual(false)
  })

  it('should populate joins using find', async () => {
    const result = await payload.find({
      collection: categoriesSlug,
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
      collection: categoriesSlug,
      where: {
        id: { equals: category.id },
      },
    })
    const otherResult = await payload.find({
      collection: categoriesSlug,
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
      collection: categoriesSlug,
      where: {
        id: { equals: category.id },
      },
    })
    const otherResultEn = await payload.find({
      collection: categoriesSlug,
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
      collection: categoriesSlug,
      locale: 'es',
      where: {
        id: { equals: category.id },
      },
    })
    const otherResultEs = await payload.find({
      collection: categoriesSlug,
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
      collection: postsSlug,
      where: {
        id: {
          in: [post_1.id, post_2.id],
        },
      },
    })
  })

  it('should not error when deleting documents with joins', async () => {
    const category = await payload.create({
      collection: categoriesSlug,
      data: {
        name: 'category with post',
      },
    })

    await createPost({
      category: category.id,
    })

    const result = await payload.delete({
      collection: categoriesSlug,
      // id: category.id,
      where: {
        id: { equals: category.id },
      },
    })

    expect(result.docs[0].id).toStrictEqual(category.id)
  })

  describe('`where` filters', () => {
    let categoryWithFilteredPost
    beforeAll(async () => {
      categoryWithFilteredPost = await payload.create({
        collection: categoriesSlug,
        data: {
          name: 'category with filtered post',
        },
      })

      await createPost({
        title: 'filtered post',
        category: categoryWithFilteredPost.id,
        isFiltered: true,
      })

      await createPost({
        title: 'unfiltered post',
        category: categoryWithFilteredPost.id,
        isFiltered: false,
      })

      categoryWithFilteredPost = await payload.findByID({
        id: categoryWithFilteredPost.id,
        collection: categoriesSlug,
      })
    })

    it('should filter joins using where from field config', () => {
      expect(categoryWithFilteredPost.filtered.docs).toHaveLength(1)
    })

    it('should filter joins using where from field config and the requested filter', async () => {
      categoryWithFilteredPost = await payload.findByID({
        id: categoryWithFilteredPost.id,
        collection: categoriesSlug,
        joins: {
          filtered: {
            where: {
              title: { not_equals: 'unfiltered post' },
            },
          },
        },
      })

      expect(categoryWithFilteredPost.filtered.docs).toHaveLength(0)
    })
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

  describe('Joins with versions', () => {
    afterEach(async () => {
      await payload.delete({ collection: 'versions', where: {} })
      await payload.delete({ collection: 'categories-versions', where: {} })
    })

    it('should populate joins when versions on both sides draft false', async () => {
      const category = await payload.create({ collection: 'categories-versions', data: {} })

      const version = await payload.create({
        collection: 'versions',
        data: { title: 'version', categoryVersion: category.id },
      })

      const res = await payload.find({ collection: 'categories-versions', draft: false })

      expect(res.docs[0].relatedVersions.docs[0].id).toBe(version.id)
    })

    it('should populate joins with hasMany relationships when versions on both sides draft false', async () => {
      const category = await payload.create({ collection: 'categories-versions', data: {} })

      const version = await payload.create({
        collection: 'versions',
        data: { title: 'version', categoryVersions: [category.id] },
      })

      const res = await payload.find({ collection: 'categories-versions', draft: false })

      expect(res.docs[0].relatedVersionsMany.docs[0].id).toBe(version.id)
    })

    it('should populate joins with hasMany relationships when versions on both sides draft true payload.db.queryDrafts', async () => {
      const category = await payload.create({ collection: 'categories-versions', data: {} })

      const version = await payload.create({
        collection: 'versions',
        data: { title: 'version', categoryVersion: category.id },
      })

      const res = await payload.find({
        collection: 'categories-versions',
        draft: true,
      })

      expect(res.docs[0].relatedVersions.docs[0].id).toBe(version.id)
    })

    it('should populate joins with hasMany when on both sides documents are in draft', async () => {
      const category = await payload.create({
        collection: 'categories-versions',
        data: { _status: 'draft' },
        draft: true,
      })

      const version = await payload.create({
        collection: 'versions',
        data: { title: 'original-title', _status: 'draft', categoryVersion: category.id },
        draft: true,
      })

      await payload.update({
        collection: 'versions',
        id: version.id,
        data: { title: 'updated-title' },
        draft: true,
      })

      const res = await payload.find({
        collection: 'categories-versions',
        draft: true,
      })

      expect(res.docs[0].relatedVersions.docs[0].id).toBe(version.id)
      expect(res.docs[0].relatedVersions.docs[0].title).toBe('updated-title')
    })

    it('should populate joins when versions on both sides draft true payload.db.queryDrafts', async () => {
      const category = await payload.create({ collection: 'categories-versions', data: {} })

      const version = await payload.create({
        collection: 'versions',
        data: { categoryVersions: [category.id], title: 'version' },
      })

      const res = await payload.find({
        collection: 'categories-versions',
        draft: true,
      })

      expect(res.docs[0].relatedVersionsMany.docs[0].id).toBe(version.id)
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

    it('should have simple paginate with page for joins', async () => {
      const query = {
        depth: 1,
        where: {
          name: { equals: 'paginate example' },
        },
        joins: {
          relatedPosts: {
            sort: 'createdAt',
            limit: 2,
            page: 1,
          },
        },
      }
      let pageWithLimit = await restClient.GET(`/categories`, { query }).then((res) => res.json())

      query.joins.relatedPosts.limit = 0
      const unlimited = await restClient.GET(`/categories`, { query }).then((res) => res.json())

      expect(pageWithLimit.docs[0].relatedPosts.docs).toHaveLength(2)
      expect(pageWithLimit.docs[0].relatedPosts.docs[0].id).toBe(
        unlimited.docs[0].relatedPosts.docs[0].id,
      )
      expect(pageWithLimit.docs[0].relatedPosts.docs[1].id).toBe(
        unlimited.docs[0].relatedPosts.docs[1].id,
      )
      query.joins.relatedPosts.limit = 2
      query.joins.relatedPosts.page = 2

      pageWithLimit = await restClient.GET(`/categories`, { query }).then((res) => res.json())

      expect(pageWithLimit.docs[0].relatedPosts.docs).toHaveLength(2)
      expect(pageWithLimit.docs[0].relatedPosts.docs[0].id).toBe(
        unlimited.docs[0].relatedPosts.docs[2].id,
      )
      expect(pageWithLimit.docs[0].relatedPosts.docs[1].id).toBe(
        unlimited.docs[0].relatedPosts.docs[3].id,
      )
    })

    it('should respect access control for join collections', async () => {
      const { docs } = await payload.find({
        collection: categoriesJoinRestrictedSlug,
        where: {
          name: { equals: 'categoryJoinRestricted' },
        },
        overrideAccess: false,
        user,
      })
      const [categoryWithRestrictedPosts] = docs
      expect(categoryWithRestrictedPosts.collectionRestrictedJoin.docs).toHaveLength(1)
      expect(categoryWithRestrictedPosts.collectionRestrictedJoin.docs[0].title).toStrictEqual(
        'should allow read',
      )
    })

    it('should respect access control for join request `where` queries', async () => {
      await expect(async () => {
        await payload.findByID({
          id: category.id,
          collection: categoriesSlug,
          overrideAccess: false,
          user,
          joins: {
            relatedPosts: {
              where: {
                restrictedField: { equals: 'restricted' },
              },
            },
          },
        })
      }).rejects.toThrow('The following path cannot be queried: restrictedField')
    })

    it('should respect access control of join field configured `where` queries', async () => {
      const restrictedCategory = await payload.create({
        collection: restrictedCategoriesSlug,
        data: {
          name: 'restricted category',
        },
      })
      await createPost({
        collection: restrictedPostsSlug,
        data: {
          title: 'restricted post',
          category: restrictedCategory.id,
        },
      })
      await expect(async () => {
        await payload.findByID({
          id: category.id,
          collection: restrictedCategoriesSlug,
          overrideAccess: false,
          user,
        })
      }).rejects.toThrow('The following path cannot be queried: restrictedField')
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

    it('should have simple paginate with page for joins', async () => {
      let queryWithLimit = `query {
    Categories(where: {
            name: { equals: "paginate example" }
          }) {
          docs {
            relatedPosts(
              sort: "createdAt",
              limit: 2
            ) {
              docs {
                title
              }
              hasNextPage
            }
          }
        }
      }`
      let pageWithLimit = await restClient
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

      expect(pageWithLimit.data.Categories.docs[0].relatedPosts.docs).toHaveLength(2)
      expect(pageWithLimit.data.Categories.docs[0].relatedPosts.docs[0].id).toStrictEqual(
        unlimited.data.Categories.docs[0].relatedPosts.docs[0].id,
      )
      expect(pageWithLimit.data.Categories.docs[0].relatedPosts.docs[1].id).toStrictEqual(
        unlimited.data.Categories.docs[0].relatedPosts.docs[1].id,
      )

      expect(pageWithLimit.data.Categories.docs[0].relatedPosts.hasNextPage).toStrictEqual(true)

      queryWithLimit = `query {
        Categories(where: {
                name: { equals: "paginate example" }
              }) {
              docs {
                relatedPosts(
                  sort: "createdAt",
                  limit: 2,
                  page: 2,
                ) {
                  docs {
                    title
                  }
                  hasNextPage
                }
              }
            }
          }`

      pageWithLimit = await restClient
        .GRAPHQL_POST({ body: JSON.stringify({ query: queryWithLimit }) })
        .then((res) => res.json())

      expect(pageWithLimit.data.Categories.docs[0].relatedPosts.docs[0].id).toStrictEqual(
        unlimited.data.Categories.docs[0].relatedPosts.docs[2].id,
      )
      expect(pageWithLimit.data.Categories.docs[0].relatedPosts.docs[1].id).toStrictEqual(
        unlimited.data.Categories.docs[0].relatedPosts.docs[3].id,
      )
    })

    it('should populate joins with hasMany when on both sides documents are in draft', async () => {
      const category = await payload.create({
        collection: 'categories-versions',
        data: { _status: 'draft' },
        draft: true,
      })

      const version = await payload.create({
        collection: 'versions',
        data: { _status: 'draft', title: 'original-title', categoryVersion: category.id },
        draft: true,
      })

      await payload.update({
        collection: 'versions',
        draft: true,
        id: version.id,
        data: { title: 'updated-title' },
      })

      const query = `query {
        CategoriesVersions(draft: true) {
              docs {
                  relatedVersions(
                    limit: 1
                  ) {
                    docs {
                      id,
                      title
                    }
                    hasNextPage
                  }
                }
            }
          }`

      const res = await restClient
        .GRAPHQL_POST({ body: JSON.stringify({ query }) })
        .then((res) => res.json())

      expect(res.data.CategoriesVersions.docs[0].relatedVersions.docs[0].id).toBe(version.id)
      expect(res.data.CategoriesVersions.docs[0].relatedVersions.docs[0].title).toBe(
        'updated-title',
      )
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

    it('should respect access control for join collections', async () => {
      const query = `query {
        CategoriesJoinRestricteds {
          docs {
            name
            collectionRestrictedJoin {
              docs {
                title
                canRead
              }
            }
          }
        }
      }`

      const response = await restClient
        .GRAPHQL_POST({ body: JSON.stringify({ query }) })
        .then((res) => res.json())
      const [categoryWithRestrictedPosts] = response.data.CategoriesJoinRestricteds.docs
      expect(categoryWithRestrictedPosts.collectionRestrictedJoin.docs).toHaveLength(1)
      expect(categoryWithRestrictedPosts.collectionRestrictedJoin.docs[0].title).toStrictEqual(
        'should allow read',
      )
    })
  })

  it('should work id.in command delimited querying with joins', async () => {
    const allCategories = await payload.find({ collection: categoriesSlug, pagination: false })

    const allCategoriesByIds = await restClient
      .GET(`/categories`, {
        query: {
          where: {
            id: {
              in: allCategories.docs.map((each) => each.id).join(','),
            },
          },
        },
      })
      .then((res) => res.json())

    expect(allCategories.totalDocs).toBe(allCategoriesByIds.totalDocs)
  })

  it('should join with singular collection name', async () => {
    const {
      docs: [category],
    } = await payload.find({ collection: categoriesSlug, limit: 1, depth: 0 })

    const singular = await payload.create({
      collection: 'singular',
      data: { category: category.id },
    })

    const categoryWithJoins = await payload.findByID({
      collection: categoriesSlug,
      id: category.id,
    })

    expect((categoryWithJoins.singulars.docs[0] as Singular).id).toBe(singular.id)
  })

  it('local API should not populate individual join by providing schemaPath=false', async () => {
    const {
      docs: [res],
    } = await payload.find({
      collection: categoriesSlug,
      where: {
        id: { equals: category.id },
      },
      joins: {
        relatedPosts: false,
      },
    })

    // removed from the result
    expect(res.relatedPosts).toBeUndefined()

    expect(res.hasManyPosts.docs).toBeDefined()
    expect(res.hasManyPostsLocalized.docs).toBeDefined()
    expect(res.group.relatedPosts.docs).toBeDefined()
    expect(res.group.camelCasePosts.docs).toBeDefined()
  })

  it('rEST API should not populate individual join by providing schemaPath=false', async () => {
    const {
      docs: [res],
    } = await restClient
      .GET(`/${categoriesSlug}`, {
        query: {
          where: {
            id: { equals: category.id },
          },
          joins: {
            relatedPosts: false,
          },
        },
      })
      .then((res) => res.json())

    // removed from the result
    expect(res.relatedPosts).toBeUndefined()

    expect(res.hasManyPosts.docs).toBeDefined()
    expect(res.hasManyPostsLocalized.docs).toBeDefined()
    expect(res.group.relatedPosts.docs).toBeDefined()
    expect(res.group.camelCasePosts.docs).toBeDefined()
  })

  it('should have correct totalDocs', async () => {
    for (let i = 0; i < 50; i++) {
      await payload.create({ collection: categoriesSlug, data: { name: 'totalDocs' } })
    }

    const count = await payload.count({
      collection: categoriesSlug,
      where: { name: { equals: 'totalDocs' } },
    })
    expect(count.totalDocs).toBe(50)

    const find = await payload.find({
      collection: categoriesSlug,
      limit: 5,
      where: { name: { equals: 'totalDocs' } },
    })
    expect(find.totalDocs).toBe(50)
    expect(find.docs).toHaveLength(5)

    await payload.delete({ collection: categoriesSlug, where: { name: { equals: 'totalDocs' } } })
  })

  it('should self join', async () => {
    const doc_1 = await payload.create({ collection: 'self-joins', data: {} })
    const doc_2 = await payload.create({ collection: 'self-joins', data: { rel: doc_1 }, depth: 0 })

    const data = await payload.findByID({ collection: 'self-joins', id: doc_1.id, depth: 1 })

    expect((data.joins.docs[0] as TypeWithID).id).toBe(doc_2.id)
  })

  it('should populate joins on depth 2', async () => {
    const depthJoin_2 = await payload.create({ collection: 'depth-joins-2', data: {}, depth: 0 })
    const depthJoin_1 = await payload.create({
      collection: 'depth-joins-1',
      data: { rel: depthJoin_2 },
      depth: 0,
    })

    const depthJoin_3 = await payload.create({
      collection: 'depth-joins-3',
      data: { rel: depthJoin_1 },
      depth: 0,
    })

    const data = await payload.findByID({
      collection: 'depth-joins-2',
      id: depthJoin_2.id,
      depth: 2,
    })

    const joinedDoc = data.joins.docs[0] as DepthJoins1

    expect(joinedDoc.id).toBe(depthJoin_1.id)

    const joinedDoc2 = joinedDoc.joins.docs[0] as DepthJoins3

    expect(joinedDoc2.id).toBe(depthJoin_3.id)
  })

  describe('Array of collection', () => {
    it('should join across multiple collections', async () => {
      let parent = await payload.create({
        collection: 'multiple-collections-parents',
        depth: 0,
        data: {},
      })

      const child_1 = await payload.create({
        collection: 'multiple-collections-1',
        depth: 0,
        data: {
          parent,
          title: 'doc-1',
        },
      })

      const child_2 = await payload.create({
        collection: 'multiple-collections-2',
        depth: 0,
        data: {
          parent,
          title: 'doc-2',
        },
      })

      parent = await payload.findByID({
        collection: 'multiple-collections-parents',
        id: parent.id,
        depth: 0,
      })

      expect(parent.children.docs[0].value).toBe(child_2.id)
      expect(parent.children.docs[0]?.relationTo).toBe('multiple-collections-2')
      expect(parent.children.docs[1]?.value).toBe(child_1.id)
      expect(parent.children.docs[1]?.relationTo).toBe('multiple-collections-1')

      parent = await payload.findByID({
        collection: 'multiple-collections-parents',
        id: parent.id,
        depth: 1,
      })

      expect(parent.children.docs[0].value.id).toBe(child_2.id)
      expect(parent.children.docs[0]?.relationTo).toBe('multiple-collections-2')
      expect(parent.children.docs[1]?.value.id).toBe(child_1.id)
      expect(parent.children.docs[1]?.relationTo).toBe('multiple-collections-1')

      // Pagination across collections
      parent = await payload.findByID({
        collection: 'multiple-collections-parents',
        id: parent.id,
        depth: 1,
        joins: {
          children: {
            limit: 1,
            sort: 'title',
          },
        },
      })

      expect(parent.children.docs).toHaveLength(1)
      expect(parent.children?.hasNextPage).toBe(true)

      parent = await payload.findByID({
        collection: 'multiple-collections-parents',
        id: parent.id,
        depth: 1,
        joins: {
          children: {
            limit: 2,
            sort: 'title',
          },
        },
      })

      expect(parent.children.docs).toHaveLength(2)
      expect(parent.children?.hasNextPage).toBe(false)

      // Sorting across collections
      parent = await payload.findByID({
        collection: 'multiple-collections-parents',
        id: parent.id,
        depth: 1,
        joins: {
          children: {
            sort: 'title',
          },
        },
      })

      expect(parent.children.docs[0]?.value.title).toBe('doc-1')
      expect(parent.children.docs[1]?.value.title).toBe('doc-2')

      parent = await payload.findByID({
        collection: 'multiple-collections-parents',
        id: parent.id,
        depth: 1,
        joins: {
          children: {
            sort: '-title',
          },
        },
      })

      expect(parent.children.docs[0]?.value.title).toBe('doc-2')
      expect(parent.children.docs[1]?.value.title).toBe('doc-1')

      // WHERE across collections
      parent = await payload.findByID({
        collection: 'multiple-collections-parents',
        id: parent.id,
        depth: 1,
        joins: {
          children: {
            where: {
              title: {
                equals: 'doc-1',
              },
            },
          },
        },
      })

      expect(parent.children?.docs).toHaveLength(1)
      expect(parent.children.docs[0]?.value.title).toBe('doc-1')

      // WHERE by relationTo (join for specific collectionSlug)
      parent = await payload.findByID({
        collection: 'multiple-collections-parents',
        id: parent.id,
        depth: 1,
        joins: {
          children: {
            where: {
              relationTo: {
                equals: 'multiple-collections-2',
              },
            },
          },
        },
      })

      // WHERE by relationTo with overrideAccess:false
      parent = await payload.findByID({
        collection: 'multiple-collections-parents',
        id: parent.id,
        overrideAccess: false,
        depth: 1,
        joins: {
          children: {
            where: {
              relationTo: {
                equals: 'multiple-collections-2',
              },
            },
          },
        },
      })

      expect(parent.children?.docs).toHaveLength(1)
      expect(parent.children.docs[0]?.value.title).toBe('doc-2')

      // counting
      parent = await payload.findByID({
        collection: 'multiple-collections-parents',
        id: parent.id,
        depth: 1,
        joins: {
          children: {
            count: true,
          },
        },
      })

      expect(parent.children?.totalDocs).toBe(2)

      // counting filtered
      parent = await payload.findByID({
        collection: 'multiple-collections-parents',
        id: parent.id,
        depth: 1,
        joins: {
          children: {
            count: true,
            where: {
              relationTo: {
                equals: 'multiple-collections-2',
              },
            },
          },
        },
      })

      expect(parent.children?.totalDocs).toBe(1)
    })
  })
})

async function createPost(overrides?: Partial<Post>, locale?: Config['locale']) {
  return payload.create({
    collection: postsSlug,
    locale,
    data: {
      title: 'test',
      ...overrides,
    },
  })
}
