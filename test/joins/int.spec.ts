import type { Payload, TypeWithID } from 'payload'

import path from 'path'
import { getFileByPath } from 'payload'
import { fileURLToPath } from 'url'
import { expect } from 'vitest'

import type { Category, Config, DepthJoins1, DepthJoins3, Post, Singular } from './payload-types.js'

import { test } from '../__helpers/int/vitest.js'
import { idToString } from '../__helpers/shared/idToString.js'
import { devUser } from '../credentials.js'
import {
  accessJoinArticlesSlug,
  accessJoinNotesSlug,
  accessJoinParentsSlug,
  categoriesJoinRestrictedSlug,
  categoriesSlug,
  operatorHandlerJoinArticlesSlug,
  operatorHandlerJoinNotesSlug,
  operatorHandlerJoinParentsSlug,
  postsSlug,
  restrictedCategoriesSlug,
  restrictedPostsSlug,
  uploadsSlug,
} from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
let token: string

const { email, password } = devUser

test.suite('Joins Field', { config: './config.ts', resetBetweenTests: false }, () => {
  let category: Category
  let otherCategory: Category
  let categoryID
  let user
  // --__--__--__--__--__--__--__--__--__
  // Boilerplate test setup/teardown
  // --__--__--__--__--__--__--__--__--__
  test.beforeAll(async ({ payloadInstance: payload, restClientInstance: restClient }) => {
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
      overrideAccess: true,
    })

    otherCategory = await payload.create({
      collection: categoriesSlug,
      data: {
        name: 'otherCategory',
        group: {},
      },
      overrideAccess: true,
    })

    // create an upload
    const imageFilePath = path.resolve(dirname, './image.png')
    const imageFile = await getFileByPath(imageFilePath)

    const { id: uploadedImage } = await payload.create({
      collection: uploadsSlug,
      data: {},
      file: imageFile,
      overrideAccess: true,
    })

    categoryID = idToString(category.id, payload)

    for (let i = 0; i < 15; i++) {
      let categories = [category.id]
      if (i % 2 === 0) {
        categories = [category.id, otherCategory.id]
      }
      await createPost(
        { payload },
        {
          array: [{ category: category.id }],
          arrayHasMany: [{ category: [category.id] }],
          blocks: [{ blockType: 'block', category: category.id }],
          categories,
          categoriesLocalized: categories,
          category: category.id,
          group: {
            camelCaseCategory: category.id,
            category: category.id,
          },
          localizedArray: [{ category: category.id }],
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
          title: `test ${i}`,
          upload: uploadedImage,
        },
      )
    }
  })

  test('should populate joins using findByID', async ({ payload }) => {
    const categoryWithPosts = await payload.findByID({
      id: category.id,
      collection: categoriesSlug,
      joins: {
        'group.relatedPosts': {
          sort: '-title',
        },
      },
      overrideAccess: true,
    })

    expect(categoryWithPosts.group.relatedPosts.docs).toHaveLength(10)
    expect(categoryWithPosts.group.relatedPosts.docs[0]).toHaveProperty('id')
    expect(categoryWithPosts.group.relatedPosts.docs[0]).toHaveProperty('title')
    expect(categoryWithPosts.group.relatedPosts.docs[0].title).toStrictEqual('test 9')
  })

  test('should not populate joins if not selected', async ({ payload }) => {
    const categoryWithPosts = await payload.findByID({
      id: category.id,
      collection: categoriesSlug,
      joins: {
        'group.relatedPosts': {
          sort: '-title',
        },
      },
      overrideAccess: true,
      select: {},
    })

    expect(Object.keys(categoryWithPosts)).toStrictEqual(['id'])
  })

  test('should populate joins if selected', async ({ payload }) => {
    const categoryWithPosts = await payload.findByID({
      id: category.id,
      collection: categoriesSlug,
      joins: {
        'group.relatedPosts': {
          sort: '-title',
        },
      },
      overrideAccess: true,
      select: {
        group: {
          relatedPosts: true,
        },
      },
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

  test('should count joins', async ({ payload }) => {
    let categoryWithPosts = await payload.findByID({
      id: category.id,
      collection: categoriesSlug,
      joins: {
        'group.relatedPosts': {
          count: true,
          sort: '-title',
        },
      },
      overrideAccess: true,
    })

    expect(categoryWithPosts.group.relatedPosts?.totalDocs).toBe(15)

    // With limit 1
    categoryWithPosts = await payload.findByID({
      id: category.id,
      collection: categoriesSlug,
      joins: {
        'group.relatedPosts': {
          count: true,
          limit: 1,
          sort: '-title',
        },
      },
      overrideAccess: true,
    })

    expect(categoryWithPosts.group.relatedPosts?.totalDocs).toBe(15)
  })

  test('should count hasMany relationship joins', async ({ payload }) => {
    const res = await payload.findByID({
      id: category.id,
      collection: categoriesSlug,
      joins: {
        hasManyPosts: { count: true, limit: 1 },
      },
      overrideAccess: true,
    })

    expect(res.hasManyPosts?.totalDocs).toBe(15)
  })

  test('should populate relationships in joins', async ({ payload }) => {
    const { docs } = await payload.find({
      collection: postsSlug,
      depth: 2,
      limit: 1,
      overrideAccess: true,
    })

    expect(docs[0].category.id).toBeDefined()
    expect(docs[0].category.name).toBeDefined()
    expect(docs[0].category.relatedPosts.docs).toHaveLength(5) // uses defaultLimit
  })

  test('should populate relationships in joins with camelCase names', async ({ payload }) => {
    const { docs } = await payload.find({
      collection: postsSlug,
      limit: 1,
      overrideAccess: true,
    })

    expect(docs[0].group.camelCaseCategory.id).toBeDefined()
    expect(docs[0].group.camelCaseCategory.name).toBeDefined()
    expect(docs[0].group.camelCaseCategory.group.camelCasePosts.docs).toHaveLength(10)
  })

  test('should populate joins with array relationships', async ({ payload }) => {
    const categoryWithPosts = await payload.findByID({
      id: category.id,
      collection: categoriesSlug,
      overrideAccess: true,
    })

    expect(categoryWithPosts.arrayPosts.docs).toBeDefined()
    expect(categoryWithPosts.arrayPosts.docs).toHaveLength(10)
  })

  test('should populate joins with array hasMany relationships', async ({ payload }) => {
    const categoryWithPosts = await payload.findByID({
      id: category.id,
      collection: categoriesSlug,
      overrideAccess: true,
    })

    expect(categoryWithPosts.arrayHasManyPosts.docs).toBeDefined()
    expect(categoryWithPosts.arrayHasManyPosts.docs).toHaveLength(10)
  })

  test('should populate joins with localized array relationships', async ({ payload }) => {
    const categoryWithPosts = await payload.findByID({
      id: category.id,
      collection: categoriesSlug,
      overrideAccess: true,
    })

    expect(categoryWithPosts.localizedArrayPosts.docs).toBeDefined()
    expect(categoryWithPosts.localizedArrayPosts.docs).toHaveLength(10)
  })

  test('should populate joins with blocks relationships', async ({ payload }) => {
    const categoryWithPosts = await payload.findByID({
      id: category.id,
      collection: categoriesSlug,
      overrideAccess: true,
    })

    expect(categoryWithPosts.blocksPosts.docs).toBeDefined()
  })

  test('should populate uploads in joins', async ({ payload }) => {
    const { docs } = await payload.find({
      collection: postsSlug,
      limit: 1,
      overrideAccess: true,
    })

    expect(docs[0].upload.id).toBeDefined()
    expect(docs[0].upload.relatedPosts.docs).toHaveLength(10)
  })

  test('should join on polymorphic relationships', async ({ payload }) => {
    const categoryWithPosts = await payload.findByID({
      id: category.id,
      collection: categoriesSlug,
      overrideAccess: true,
    })
    expect(categoryWithPosts.polymorphic.docs[0]).toHaveProperty('id')
    expect(categoryWithPosts.polymorphics.docs[0]).toHaveProperty('id')
    expect(categoryWithPosts.localizedPolymorphic.docs[0]).toHaveProperty('id')
    expect(categoryWithPosts.localizedPolymorphics.docs[0]).toHaveProperty('id')
  })

  test('should not throw a path validation error when querying joins with polymorphic relationships', async ({
    payload,
  }) => {
    const folderDoc = await payload.create({
      collection: 'folders',
      data: {
        name: 'sharedFolder',
      },
      overrideAccess: true,
    })

    await payload.create({
      collection: 'folderPoly1',
      data: {
        _h_folders: folderDoc.id,
        folderPoly1Title: 'Poly 1 title',
      },
      depth: 0,
      overrideAccess: true,
    })

    await payload.create({
      collection: 'folderPoly2',
      data: {
        _h_folders: folderDoc.id,
        folderPoly2Title: 'Poly 2 Title',
      },
      depth: 0,
      overrideAccess: true,
    })

    const result = await payload.find({
      collection: 'folders',
      joins: {
        children: {
          limit: 100_000,
          sort: 'name',
          where: {
            and: [
              {
                relationTo: {
                  in: ['folderPoly1', 'folderPoly2'],
                },
              },
              {
                folderPoly2Title: {
                  equals: 'Poly 2 Title',
                },
              },
            ],
          },
        },
      },
      overrideAccess: true,
      where: {
        id: {
          equals: folderDoc.id,
        },
      },
    })

    expect(result.docs[0]?.children.docs).toHaveLength(1)
  })

  test('should allow join where query on hasMany select fields', async ({ payload }) => {
    const folderDoc = await payload.create({
      collection: 'folders',
      data: {
        name: 'scopedFolder',
        folderType: ['folderPoly1', 'folderPoly2'],
      },
      overrideAccess: true,
    })

    await payload.create({
      collection: 'folders',
      data: {
        name: 'childFolder',
        _h_folders: folderDoc.id,
        folderType: ['folderPoly1'],
      },
      overrideAccess: true,
    })

    const findFolder = await payload.find({
      collection: 'folders',
      joins: {
        children: {
          limit: 100_000,
          sort: 'name',
          where: {
            and: [
              {
                relationTo: {
                  equals: 'folders',
                },
              },
              {
                folderType: {
                  in: ['folderPoly1'],
                },
              },
            ],
          },
        },
      },
      overrideAccess: true,
      where: {
        id: {
          equals: folderDoc.id,
        },
      },
    })

    expect(findFolder?.docs[0]?.children?.docs).toHaveLength(1)
  })

  test('should query where with exists for hasMany select fields', async ({ payload }) => {
    await payload.delete({ collection: 'folders', overrideAccess: true, where: {} })
    const folderDoc = await payload.create({
      collection: 'folders',
      data: {
        name: 'scopedFolder',
        folderType: ['folderPoly1', 'folderPoly2'],
      },
      overrideAccess: true,
    })

    await payload.create({
      collection: 'folders',
      data: {
        name: 'childFolder',
        _h_folders: folderDoc.id,
        folderType: ['folderPoly1'],
      },
      overrideAccess: true,
    })

    const findFolder = await payload.find({
      collection: 'folders',
      joins: {
        children: {
          limit: 100_000,
          sort: 'name',
          where: {
            and: [
              {
                relationTo: {
                  equals: 'folders',
                },
              },
              {
                or: [
                  {
                    folderType: {
                      in: ['folderPoly1'],
                    },
                  },
                  {
                    folderType: {
                      exists: false,
                    },
                  },
                ],
              },
            ],
          },
        },
      },
      overrideAccess: true,
      where: {
        id: {
          equals: folderDoc.id,
        },
      },
    })

    expect(findFolder?.docs[0]?.children?.docs).toHaveLength(1)
  })

  test('should filter joins using where query', async ({ payload }) => {
    const categoryWithPosts = await payload.findByID({
      id: category.id,
      collection: categoriesSlug,
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
      overrideAccess: true,
    })

    expect(categoryWithPosts.relatedPosts.docs).toHaveLength(1)
    expect(categoryWithPosts.relatedPosts.hasNextPage).toStrictEqual(false)
  })

  test('should apply defaultSort when no sort is specified in join query', async ({ payload }) => {
    const categoryWithPosts = await payload.findByID({
      id: category.id,
      collection: categoriesSlug,
      overrideAccess: true,
    })

    // relatedPosts join has defaultSort: '-title', defaultLimit: 5
    expect(categoryWithPosts.relatedPosts!.docs).toHaveLength(5)
    expect((categoryWithPosts.relatedPosts!.docs![0] as Post).title).toStrictEqual('test 9')
  })

  test('should override defaultSort when sort is specified in join query', async ({ payload }) => {
    const categoryWithPosts = await payload.findByID({
      id: category.id,
      collection: categoriesSlug,
      joins: {
        relatedPosts: {
          sort: 'title',
        },
      },
      overrideAccess: true,
    })

    // ascending sort overrides defaultSort: '-title'
    expect((categoryWithPosts.relatedPosts!.docs![0] as Post).title).toStrictEqual('test 0')
  })

  test('should populate joins using find', async ({ payload }) => {
    const result = await payload.find({
      collection: categoriesSlug,
      overrideAccess: true,
      where: {
        id: { equals: category.id },
      },
    })

    const [categoryWithPosts] = result.docs

    expect(categoryWithPosts.group.relatedPosts.docs).toHaveLength(10)
    expect(categoryWithPosts.group.relatedPosts.docs[0]).toHaveProperty('title')
    expect(categoryWithPosts.group.relatedPosts.docs[0].title).toBe('test 14')
  })

  test('should populate joins using find with hasMany relationships', async ({ payload }) => {
    const result = await payload.find({
      collection: categoriesSlug,
      overrideAccess: true,
      where: {
        id: { equals: category.id },
      },
    })
    const otherResult = await payload.find({
      collection: categoriesSlug,
      overrideAccess: true,
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

  test('should populate joins using find with hasMany localized relationships', async ({
    payload,
  }) => {
    const post_1 = await createPost(
      { payload },
      {
        categoriesLocalized: [category.id],
        group: {
          camelCaseCategory: category.id,
          category: category.id,
        },
        title: `test es localized 1`,
      },
      'es',
    )

    const post_2 = await createPost(
      { payload },
      {
        categoriesLocalized: [otherCategory.id],
        group: {
          camelCaseCategory: category.id,
          category: category.id,
        },
        title: `test es localized 2`,
      },
      'es',
    )

    const resultEn = await payload.find({
      collection: categoriesSlug,
      overrideAccess: true,
      where: {
        id: { equals: category.id },
      },
    })
    const otherResultEn = await payload.find({
      collection: categoriesSlug,
      overrideAccess: true,
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
      overrideAccess: true,
      where: {
        id: { equals: category.id },
      },
    })
    const otherResultEs = await payload.find({
      collection: categoriesSlug,
      locale: 'es',
      overrideAccess: true,
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
      overrideAccess: true,
      where: {
        id: {
          in: [post_1.id, post_2.id],
        },
      },
    })
  })

  test('should not error when deleting documents with joins', async ({ payload }) => {
    const category = await payload.create({
      collection: categoriesSlug,
      data: {
        name: 'category with post',
      },
      overrideAccess: true,
    })

    await createPost(
      { payload },
      {
        category: category.id,
      },
    )

    const result = await payload.delete({
      collection: categoriesSlug,
      // id: category.id,
      overrideAccess: true,
      where: {
        id: { equals: category.id },
      },
    })

    expect(result.docs[0].id).toStrictEqual(category.id)
  })

  test.describe('`where` filters', () => {
    let categoryWithFilteredPost
    test.beforeAll(async ({ payloadInstance: payload }) => {
      categoryWithFilteredPost = await payload.create({
        collection: categoriesSlug,
        data: {
          name: 'category with filtered post',
        },
        overrideAccess: true,
      })

      await createPost(
        { payload },
        {
          category: categoryWithFilteredPost.id,
          isFiltered: true,
          title: 'filtered post',
        },
      )

      await createPost(
        { payload },
        {
          category: categoryWithFilteredPost.id,
          isFiltered: false,
          title: 'unfiltered post',
        },
      )

      categoryWithFilteredPost = await payload.findByID({
        id: categoryWithFilteredPost.id,
        collection: categoriesSlug,
        overrideAccess: true,
      })
    })

    test('should filter joins using where from field config', () => {
      expect(categoryWithFilteredPost.filtered.docs).toHaveLength(1)
    })

    test('should filter joins using where from field config and the requested filter', async ({
      payload,
    }) => {
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
        overrideAccess: true,
      })

      expect(categoryWithFilteredPost.filtered.docs).toHaveLength(0)
    })
  })

  test.describe('Joins with localization', () => {
    let localizedCategory: Category

    test.beforeAll(async ({ payloadInstance: payload }) => {
      localizedCategory = await payload.create({
        collection: 'localized-categories',
        data: {
          name: 'localized category',
        },
        locale: 'en',
        overrideAccess: true,
      })
      const post1 = await payload.create({
        collection: 'localized-posts',
        data: {
          category: localizedCategory.id,
          title: 'english post 1',
        },
        locale: 'en',
        overrideAccess: true,
      })
      await payload.update({
        id: post1.id,
        collection: 'localized-posts',
        data: {
          category: localizedCategory.id,
          title: 'spanish post',
        },
        locale: 'es',
        overrideAccess: true,
      })
      await payload.create({
        collection: 'localized-posts',
        data: {
          category: localizedCategory.id,
          title: 'english post 2',
        },
        locale: 'en',
        overrideAccess: true,
      })
    })

    test('should populate joins using findByID with localization on the relationship', async ({
      payload,
    }) => {
      const enCategory = await payload.findByID({
        id: localizedCategory.id,
        collection: 'localized-categories',
        locale: 'en',
        overrideAccess: true,
      })
      const esCategory = await payload.findByID({
        id: localizedCategory.id,
        collection: 'localized-categories',
        locale: 'es',
        overrideAccess: true,
      })
      expect(enCategory.relatedPosts.docs).toHaveLength(2)
      expect(esCategory.relatedPosts.docs).toHaveLength(1)
    })
  })

  test.describe('Joins with versions', () => {
    test.afterEach(async ({ payload }) => {
      await payload.delete({ collection: 'versions', overrideAccess: true, where: {} })
      await payload.delete({ collection: 'categories-versions', overrideAccess: true, where: {} })
    })

    test('should populate joins when versions on both sides draft false', async ({ payload }) => {
      const category = await payload.create({
        collection: 'categories-versions',
        data: {},
        overrideAccess: true,
      })

      const version = await payload.create({
        collection: 'versions',
        data: { categoryVersion: category.id, title: 'version' },
        overrideAccess: true,
      })

      const res = await payload.find({
        collection: 'categories-versions',
        draft: false,
        overrideAccess: true,
      })

      expect(res.docs[0].relatedVersions.docs[0].id).toBe(version.id)
    })

    test('should populate joins with hasMany relationships when versions on both sides draft false', async ({
      payload,
    }) => {
      const category = await payload.create({
        collection: 'categories-versions',
        data: {},
        overrideAccess: true,
      })

      const version = await payload.create({
        collection: 'versions',
        data: { categoryVersions: [category.id], title: 'version' },
        overrideAccess: true,
      })

      const res = await payload.find({
        collection: 'categories-versions',
        draft: false,
        overrideAccess: true,
      })

      expect(res.docs[0].relatedVersionsMany.docs[0].id).toBe(version.id)
    })

    test('should populate joins with hasMany relationships when versions on both sides draft true payload.db.queryDrafts', async ({
      payload,
    }) => {
      const category = await payload.create({
        collection: 'categories-versions',
        data: {},
        overrideAccess: true,
      })

      const version = await payload.create({
        collection: 'versions',
        data: { categoryVersion: category.id, title: 'version' },
        overrideAccess: true,
      })

      const res = await payload.find({
        collection: 'categories-versions',
        draft: true,
        overrideAccess: true,
      })

      expect(res.docs[0].relatedVersions.docs[0].id).toBe(version.id)
    })

    test('should populate joins with hasMany when on both sides documents are in draft', async ({
      payload,
    }) => {
      const category = await payload.create({
        collection: 'categories-versions',
        data: { _status: 'draft' },
        draft: true,
        overrideAccess: true,
      })

      const version = await payload.create({
        collection: 'versions',
        data: { _status: 'draft', categoryVersion: category.id, title: 'original-title' },
        draft: true,
        overrideAccess: true,
      })

      await payload.update({
        id: version.id,
        collection: 'versions',
        data: { title: 'updated-title' },
        draft: true,
        overrideAccess: true,
      })

      const res = await payload.find({
        collection: 'categories-versions',
        draft: true,
        overrideAccess: true,
      })

      expect(res.docs[0].relatedVersions.docs[0].id).toBe(version.id)
      expect(res.docs[0].relatedVersions.docs[0].title).toBe('updated-title')
    })

    test('should populate joins when versions on both sides draft true payload.db.queryDrafts', async ({
      payload,
    }) => {
      const category = await payload.create({
        collection: 'categories-versions',
        data: {},
        overrideAccess: true,
      })

      const version = await payload.create({
        collection: 'versions',
        data: { categoryVersions: [category.id], title: 'version' },
        overrideAccess: true,
      })

      const res = await payload.find({
        collection: 'categories-versions',
        draft: true,
        overrideAccess: true,
      })

      expect(res.docs[0].relatedVersionsMany.docs[0].id).toBe(version.id)
    })
  })

  test.describe('REST', () => {
    test('should have simple paginate for joins through REST', async ({ restClient }) => {
      const query = {
        depth: 1,
        joins: {
          relatedPosts: {
            limit: 4,
            sort: 'createdAt',
          },
        },
        where: {
          name: { equals: 'paginate example' },
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

    test('should have simple paginate with page for joins through REST', async ({ restClient }) => {
      const query = {
        depth: 1,
        joins: {
          relatedPosts: {
            limit: 2,
            page: 1,
            sort: 'createdAt',
          },
        },
        where: {
          name: { equals: 'paginate example' },
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

    test('should respect access control for join collections', async ({ payload }) => {
      const { docs } = await payload.find({
        collection: categoriesJoinRestrictedSlug,
        overrideAccess: false,
        user,
        where: {
          name: { equals: 'categoryJoinRestricted' },
        },
      })
      const [categoryWithRestrictedPosts] = docs
      expect(categoryWithRestrictedPosts.collectionRestrictedJoin.docs).toHaveLength(1)
      expect(categoryWithRestrictedPosts.collectionRestrictedJoin.docs[0].title).toStrictEqual(
        'should allow read',
      )
    })

    test('should respect access control for join request `where` queries', async ({ payload }) => {
      await expect(
        payload.findByID({
          id: category.id,
          collection: categoriesSlug,
          joins: {
            relatedPosts: {
              where: {
                restrictedField: { equals: 'restricted' },
              },
            },
          },
          overrideAccess: false,
          user,
        }),
      ).rejects.toThrow('The following path cannot be queried: restrictedField')
    })

    test('should respect access control of join field configured `where` queries', async ({
      payload,
    }) => {
      const restrictedCategory = await payload.create({
        collection: restrictedCategoriesSlug,
        data: {
          name: 'restricted category',
        },
        overrideAccess: true,
      })
      await createPost(
        { payload },
        {
          collection: restrictedPostsSlug,
          data: {
            category: restrictedCategory.id,
            title: 'restricted post',
          },
        },
      )
      await expect(
        payload.findByID({
          id: category.id,
          collection: restrictedCategoriesSlug,
          overrideAccess: false,
          user,
        }),
      ).rejects.toThrow('The following path cannot be queried: restrictedField')
    })

    test('should sort joins', async ({ restClient }) => {
      const response = await restClient
        .GET(`/categories/${category.id}?joins[relatedPosts][sort]=-title`)
        .then((res) => res.json())
      expect(response.relatedPosts.docs[0].title).toStrictEqual('test 9')
    })

    test('should query in on collections with joins', async ({ restClient }) => {
      const response = await restClient
        .GET(`/categories?where[id][in]=${category.id}`)
        .then((res) => res.json())
      expect(response.docs[0].name).toStrictEqual(category.name)
    })
  })

  test.describe('GraphQL', () => {
    test('should have simple paginate for joins', async ({ restClient }) => {
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

    test('should return totalDocs with count: true', async ({ restClient }) => {
      const queryWithLimit = `query {
    Categories(where: {
            name: { equals: "paginate example" }
          }) {
          docs {
            relatedPosts(
              sort: "createdAt",
              limit: 4,
              count: true
            ) {
              docs {
                title
              }
              hasNextPage
              totalDocs
            }
          }
        }
      }`
      const pageWithLimit = await restClient
        .GRAPHQL_POST({ body: JSON.stringify({ query: queryWithLimit }) })
        .then((res) => res.json())
      expect(pageWithLimit.data.Categories.docs[0].relatedPosts.docs).toHaveLength(4)
      expect(pageWithLimit.data.Categories.docs[0].relatedPosts.docs[0].title).toStrictEqual(
        'test 0',
      )
      expect(pageWithLimit.data.Categories.docs[0].relatedPosts.hasNextPage).toStrictEqual(true)
      expect(pageWithLimit.data.Categories.docs[0].relatedPosts.totalDocs).toStrictEqual(15)
    })

    test('should have simple paginate with page for joins', async ({ restClient }) => {
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

    test('should have simple paginate with page for joins polymorphic', async ({ restClient }) => {
      let queryWithLimit = `query {
    Categories(where: {
            name: { equals: "paginate example" }
          }) {
          docs {
            polymorphic(
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
            polymorphic(
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

      expect(pageWithLimit.data.Categories.docs[0].polymorphic.docs).toHaveLength(2)
      expect(pageWithLimit.data.Categories.docs[0].polymorphic.docs[0].id).toStrictEqual(
        unlimited.data.Categories.docs[0].polymorphic.docs[0].id,
      )
      expect(pageWithLimit.data.Categories.docs[0].polymorphic.docs[1].id).toStrictEqual(
        unlimited.data.Categories.docs[0].polymorphic.docs[1].id,
      )

      expect(pageWithLimit.data.Categories.docs[0].polymorphic.hasNextPage).toStrictEqual(true)

      queryWithLimit = `query {
        Categories(where: {
                name: { equals: "paginate example" }
              }) {
              docs {
                polymorphic(
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

      expect(pageWithLimit.data.Categories.docs[0].polymorphic.docs[0].id).toStrictEqual(
        unlimited.data.Categories.docs[0].polymorphic.docs[2].id,
      )
      expect(pageWithLimit.data.Categories.docs[0].polymorphic.docs[1].id).toStrictEqual(
        unlimited.data.Categories.docs[0].polymorphic.docs[3].id,
      )
    })

    test('should populate joins with hasMany when both GraphQL documents are in draft', async ({
      payload,
      restClient,
    }) => {
      const category = await payload.create({
        collection: 'categories-versions',
        data: { _status: 'draft' },
        draft: true,
        overrideAccess: true,
      })

      const version = await payload.create({
        collection: 'versions',
        data: { _status: 'draft', categoryVersion: category.id, title: 'original-title' },
        draft: true,
        overrideAccess: true,
      })

      await payload.update({
        id: version.id,
        collection: 'versions',
        data: { title: 'updated-title' },
        draft: true,
        overrideAccess: true,
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

    test('should have simple paginate for joins inside groups', async ({ restClient }) => {
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

    test('should sort joins through GraphQL', async ({ restClient }) => {
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

    test('should query in on collections with joins through GraphQL', async ({ restClient }) => {
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

    test('should respect access control for join collections through GraphQL', async ({
      restClient,
    }) => {
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

  test('should work id.in command delimited querying with joins', async ({
    payload,
    restClient,
  }) => {
    const allCategories = await payload.find({
      collection: categoriesSlug,
      overrideAccess: true,
      pagination: false,
    })

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

  test('should join with singular collection name', async ({ payload }) => {
    const {
      docs: [category],
    } = await payload.find({ collection: categoriesSlug, depth: 0, limit: 1, overrideAccess: true })

    const singular = await payload.create({
      collection: 'singular',
      data: { category: category.id },
      overrideAccess: true,
    })

    const categoryWithJoins = await payload.findByID({
      id: category.id,
      collection: categoriesSlug,
      overrideAccess: true,
    })

    expect((categoryWithJoins.singulars.docs[0] as Singular).id).toBe(singular.id)
  })

  test('local API should not populate individual join by providing schemaPath=false', async ({
    payload,
  }) => {
    const {
      docs: [res],
    } = await payload.find({
      collection: categoriesSlug,
      joins: {
        relatedPosts: false,
      },
      overrideAccess: true,
      where: {
        id: { equals: category.id },
      },
    })

    // removed from the result
    expect(res.relatedPosts).toBeUndefined()

    expect(res.hasManyPosts.docs).toBeDefined()
    expect(res.hasManyPostsLocalized.docs).toBeDefined()
    expect(res.group.relatedPosts.docs).toBeDefined()
    expect(res.group.camelCasePosts.docs).toBeDefined()
  })

  test('rEST API should not populate individual join by providing schemaPath=false', async ({
    restClient,
  }) => {
    const {
      docs: [res],
    } = await restClient
      .GET(`/${categoriesSlug}`, {
        query: {
          joins: {
            relatedPosts: false,
          },
          where: {
            id: { equals: category.id },
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

  test('should have correct totalDocs', async ({ payload }) => {
    for (let i = 0; i < 50; i++) {
      await payload.create({
        collection: categoriesSlug,
        data: { name: 'totalDocs' },
        overrideAccess: true,
      })
    }

    const count = await payload.count({
      collection: categoriesSlug,
      overrideAccess: true,
      where: { name: { equals: 'totalDocs' } },
    })
    expect(count.totalDocs).toBe(50)

    const find = await payload.find({
      collection: categoriesSlug,
      limit: 5,
      overrideAccess: true,
      where: { name: { equals: 'totalDocs' } },
    })
    expect(find.totalDocs).toBe(50)
    expect(find.docs).toHaveLength(5)

    await payload.delete({
      collection: categoriesSlug,
      overrideAccess: true,
      where: { name: { equals: 'totalDocs' } },
    })
  })

  test('should self join', async ({ payload }) => {
    const doc_1 = await payload.create({ collection: 'self-joins', data: {}, overrideAccess: true })
    const doc_2 = await payload.create({
      collection: 'self-joins',
      data: { rel: doc_1 },
      depth: 0,
      overrideAccess: true,
    })

    const data = await payload.findByID({
      id: doc_1.id,
      collection: 'self-joins',
      depth: 1,
      overrideAccess: true,
    })

    expect((data.joins.docs[0] as TypeWithID).id).toBe(doc_2.id)
  })

  test('should populate joins on depth 2', async ({ payload }) => {
    const depthJoin_2 = await payload.create({
      collection: 'depth-joins-2',
      data: {},
      depth: 0,
      overrideAccess: true,
    })
    const depthJoin_1 = await payload.create({
      collection: 'depth-joins-1',
      data: { rel: depthJoin_2 },
      depth: 0,
      overrideAccess: true,
    })

    const depthJoin_3 = await payload.create({
      collection: 'depth-joins-3',
      data: { rel: depthJoin_1 },
      depth: 0,
      overrideAccess: true,
    })

    const data = await payload.findByID({
      id: depthJoin_2.id,
      collection: 'depth-joins-2',
      depth: 2,
      overrideAccess: true,
    })

    const joinedDoc = data.joins.docs[0] as DepthJoins1

    expect(joinedDoc.id).toBe(depthJoin_1.id)

    const joinedDoc2 = joinedDoc.joins.docs[0] as DepthJoins3

    expect(joinedDoc2.id).toBe(depthJoin_3.id)
  })

  test.describe('Array of collection', () => {
    test('should join across multiple collections', async ({ payload }) => {
      let parent = await payload.create({
        collection: 'multiple-collections-parents',
        data: {},
        depth: 0,
        overrideAccess: true,
      })

      const child_1 = await payload.create({
        collection: 'multiple-collections-1',
        data: {
          parent,
          title: 'doc-1',
        },
        depth: 0,
        overrideAccess: true,
      })

      const child_2 = await payload.create({
        collection: 'multiple-collections-2',
        data: {
          parent,
          title: 'doc-2',
        },
        depth: 0,
        overrideAccess: true,
      })

      parent = await payload.findByID({
        id: parent.id,
        collection: 'multiple-collections-parents',
        depth: 0,
        overrideAccess: true,
      })

      const child1Reference = parent.children.docs.find(
        ({ relationTo }) => relationTo === 'multiple-collections-1',
      )
      const child2Reference = parent.children.docs.find(
        ({ relationTo }) => relationTo === 'multiple-collections-2',
      )

      expect(child1Reference?.value).toBe(child_1.id)
      expect(child2Reference?.value).toBe(child_2.id)

      parent = await payload.findByID({
        id: parent.id,
        collection: 'multiple-collections-parents',
        depth: 1,
        overrideAccess: true,
      })

      const populatedChild1Reference = parent.children.docs.find(
        ({ relationTo }) => relationTo === 'multiple-collections-1',
      )
      const populatedChild2Reference = parent.children.docs.find(
        ({ relationTo }) => relationTo === 'multiple-collections-2',
      )

      expect(populatedChild1Reference?.value.id).toBe(child_1.id)
      expect(populatedChild2Reference?.value.id).toBe(child_2.id)

      // Pagination across collections
      parent = await payload.findByID({
        id: parent.id,
        collection: 'multiple-collections-parents',
        depth: 1,
        joins: {
          children: {
            limit: 1,
            sort: 'title',
          },
        },
        overrideAccess: true,
      })

      expect(parent.children.docs).toHaveLength(1)
      expect(parent.children?.hasNextPage).toBe(true)

      parent = await payload.findByID({
        id: parent.id,
        collection: 'multiple-collections-parents',
        depth: 1,
        joins: {
          children: {
            limit: 2,
            sort: 'title',
          },
        },
        overrideAccess: true,
      })

      expect(parent.children.docs).toHaveLength(2)
      expect(parent.children?.hasNextPage).toBe(false)

      // Sorting across collections
      parent = await payload.findByID({
        id: parent.id,
        collection: 'multiple-collections-parents',
        depth: 1,
        joins: {
          children: {
            sort: 'title',
          },
        },
        overrideAccess: true,
      })

      expect(parent.children.docs[0]?.value.title).toBe('doc-1')
      expect(parent.children.docs[1]?.value.title).toBe('doc-2')

      parent = await payload.findByID({
        id: parent.id,
        collection: 'multiple-collections-parents',
        depth: 1,
        joins: {
          children: {
            sort: '-title',
          },
        },
        overrideAccess: true,
      })

      expect(parent.children.docs[0]?.value.title).toBe('doc-2')
      expect(parent.children.docs[1]?.value.title).toBe('doc-1')

      // WHERE across collections
      parent = await payload.findByID({
        id: parent.id,
        collection: 'multiple-collections-parents',
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
        overrideAccess: true,
      })

      expect(parent.children?.docs).toHaveLength(1)
      expect(parent.children.docs[0]?.value.title).toBe('doc-1')

      // WHERE by relationTo (join for specific collectionSlug)
      parent = await payload.findByID({
        id: parent.id,
        collection: 'multiple-collections-parents',
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
        overrideAccess: true,
      })

      // WHERE by relationTo with overrideAccess:false
      parent = await payload.findByID({
        id: parent.id,
        collection: 'multiple-collections-parents',
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
        overrideAccess: false,
      })

      expect(parent.children?.docs).toHaveLength(1)
      expect(parent.children.docs[0]?.value.title).toBe('doc-2')

      // counting
      parent = await payload.findByID({
        id: parent.id,
        collection: 'multiple-collections-parents',
        depth: 1,
        joins: {
          children: {
            count: true,
          },
        },
        overrideAccess: true,
      })

      expect(parent.children?.totalDocs).toBe(2)

      // counting filtered
      parent = await payload.findByID({
        id: parent.id,
        collection: 'multiple-collections-parents',
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
        overrideAccess: true,
      })

      expect(parent.children?.totalDocs).toBe(1)
    })
  })

  test.options.describe('Constrained joins', { db: 'drizzle' }, () => {
    test.afterEach(async ({ payload }) => {
      await payload.delete({ collection: accessJoinArticlesSlug, overrideAccess: true, where: {} })
      await payload.delete({ collection: accessJoinNotesSlug, overrideAccess: true, where: {} })
      await payload.delete({ collection: accessJoinParentsSlug, overrideAccess: true, where: {} })
      await payload.delete({
        collection: operatorHandlerJoinArticlesSlug,
        overrideAccess: true,
        where: {},
      })
      await payload.delete({
        collection: operatorHandlerJoinNotesSlug,
        overrideAccess: true,
        where: {},
      })
      await payload.delete({
        collection: operatorHandlerJoinParentsSlug,
        overrideAccess: true,
        where: {},
      })
    })

    const createConstrainedJoinDocuments = async (payload: Payload) => {
      const parent = await payload.create({
        collection: accessJoinParentsSlug,
        data: {},
        depth: 0,
        overrideAccess: true,
      })

      const allowedChild = await payload.create({
        collection: accessJoinArticlesSlug,
        data: {
          articleMeta: {
            articleTags: ['available'],
            status: 'reviewed',
          },
          articleTags: ['available'],
          availability: 'available',
          details: {
            articleTags: ['available'],
            mixedTags: ['available'],
            status: 'available',
            tags: ['available'],
          },
          owner: user,
          parent,
          score: 5,
          settings: { approved: true },
          tags: ['available', 'allowed-marker'],
          title: 'available child',
          variantSelect: 'available',
        },
        depth: 0,
        overrideAccess: true,
      })

      const restrictedChild = await payload.create({
        collection: accessJoinNotesSlug,
        data: {
          articleMeta: { status: 'reviewed' },
          availability: 'unavailable',
          details: {
            mixedTags: 'available',
            tags: ['available'],
          },
          details_status: 'available',
          owner: user,
          parent,
          score: 15,
          settings: { approved: true },
          tags: ['available', 'not-permitted'],
          title: 'restricted child',
          variantSelect: 'available',
        },
        depth: 0,
        overrideAccess: true,
      })

      const missingAvailabilityChild = await payload.create({
        collection: accessJoinNotesSlug,
        data: {
          articleMeta: { status: 'reviewed' },
          availability: 'missing',
          details: {
            mixedTags: 'available',
            tags: ['available'],
          },
          details_status: 'available',
          owner: user,
          parent,
          score: 20,
          settings: { approved: true },
          tags: ['available'],
          title: 'Niño',
        },
        depth: 0,
        overrideAccess: true,
      })

      const partialTagChild = await payload.create({
        collection: accessJoinNotesSlug,
        data: {
          articleMeta: { status: 'reviewed' },
          availability: 'available',
          details: {
            mixedTags: 'available',
            tags: ['available'],
          },
          details_status: 'available',
          owner: user,
          parent,
          score: 25,
          settings: { approved: true },
          tags: ['unavailable'],
          title: 'available child',
        },
        depth: 0,
        overrideAccess: true,
      })

      return {
        allowedChild,
        children: [allowedChild, restrictedChild, missingAvailabilityChild, partialTagChild],
        missingAvailabilityChild,
        parent,
        partialTagChild,
        restrictedChild,
      }
    }

    test('should apply all access constraints through the Local API', async ({ payload }) => {
      const { allowedChild, parent } = await createConstrainedJoinDocuments(payload)

      const result = await payload.findByID({
        id: parent.id,
        collection: accessJoinParentsSlug,
        depth: 1,
        joins: {
          children: {
            count: true,
          },
        },
        overrideAccess: false,
        user,
      })

      expect(result.children.docs).toHaveLength(1)
      expect(result.children.docs[0]?.value.id).toBe(allowedChild.id)
      expect(result.children.totalDocs).toBe(1)
    })

    test('should apply all access constraints through REST', async ({ payload, restClient }) => {
      const { allowedChild, parent } = await createConstrainedJoinDocuments(payload)

      const result = await restClient
        .GET(`/${accessJoinParentsSlug}/${parent.id}`, {
          query: {
            depth: 1,
            joins: {
              children: {
                count: true,
              },
            },
          },
        })
        .then((response) => response.json())

      expect(result.children.docs).toHaveLength(1)
      expect(result.children.docs[0]?.value.id).toBe(allowedChild.id)
      expect(result.children.totalDocs).toBe(1)
    })

    test('should normalize REST values for has-many select join constraints', async ({
      payload,
      restClient,
    }) => {
      const { allowedChild, parent } = await createConstrainedJoinDocuments(payload)

      const noTagsResult = await restClient
        .GET(`/${accessJoinParentsSlug}/${parent.id}`, {
          query: {
            depth: 1,
            joins: {
              children: {
                count: true,
                where: { tags: { exists: 'false' } },
              },
            },
          },
        })
        .then((response) => response.json())
      const matchingTagResult = await restClient
        .GET(`/${accessJoinParentsSlug}/${parent.id}`, {
          query: {
            depth: 1,
            joins: {
              children: {
                count: true,
                where: { tags: { in: 'available' } },
              },
            },
          },
        })
        .then((response) => response.json())

      expect(noTagsResult.children.docs).toHaveLength(0)
      expect(noTagsResult.children.totalDocs).toBe(0)
      expect(matchingTagResult.children.docs).toHaveLength(1)
      expect(matchingTagResult.children.docs[0]?.value.id).toBe(allowedChild.id)
      expect(matchingTagResult.children.totalDocs).toBe(1)
    })

    test('should normalize REST values for absent scalar and relationTo constraints', async ({
      payload,
      restClient,
    }) => {
      const { allowedChild, parent } = await createConstrainedJoinDocuments(payload)
      const allowedNote = await payload.create({
        collection: accessJoinNotesSlug,
        data: {
          availability: 'available',
          parent,
          tags: ['available'],
          title: 'available note',
        },
        depth: 0,
        overrideAccess: true,
      })

      const absentScalarResult = await restClient
        .GET(`/${accessJoinParentsSlug}/${parent.id}`, {
          query: {
            depth: 1,
            joins: {
              children: {
                count: true,
                where: { 'details.status': { exists: 'false' } },
              },
            },
          },
        })
        .then((response) => response.json())
      const relationToResult = await restClient
        .GET(`/${accessJoinParentsSlug}/${parent.id}`, {
          query: {
            depth: 1,
            joins: {
              children: {
                count: true,
                where: {
                  relationTo: { in: `${accessJoinArticlesSlug},${accessJoinNotesSlug}` },
                },
              },
            },
          },
        })
        .then((response) => response.json())
      const relationToReferences = relationToResult.children.docs
        .map(({ relationTo, value }) => `${relationTo}:${value.id.toString()}`)
        .sort()

      expect(absentScalarResult.children.docs).toHaveLength(1)
      expect(absentScalarResult.children.docs[0]?.value.id).toBe(allowedNote.id)
      expect(absentScalarResult.children.totalDocs).toBe(1)
      expect(relationToReferences).toEqual(
        [
          `${accessJoinArticlesSlug}:${allowedChild.id.toString()}`,
          `${accessJoinNotesSlug}:${allowedNote.id.toString()}`,
        ].sort(),
      )
      expect(relationToResult.children.totalDocs).toBe(2)
    })

    test('should reject an access value that cannot be normalized', async ({ payload }) => {
      const { parent } = await createConstrainedJoinDocuments(payload)

      await expect(
        payload.findByID({
          id: parent.id,
          collection: accessJoinParentsSlug,
          context: { useUndefinedInAccessConstraint: true },
          depth: 1,
          joins: { children: { count: true } },
          overrideAccess: false,
          user,
        }),
      ).rejects.toThrow('The following path cannot be queried: id.in')
    })

    test('should apply all operators in Local API join constraints', async ({ payload }) => {
      const { allowedChild, parent } = await createConstrainedJoinDocuments(payload)

      const result = await payload.findByID({
        id: parent.id,
        collection: accessJoinParentsSlug,
        depth: 1,
        joins: {
          children: {
            where: {
              score: {
                greater_than: 0,
                less_than: 10,
              },
            },
          },
        },
        overrideAccess: true,
      })

      expect(result.children.docs).toHaveLength(1)
      expect(result.children.docs[0]?.value.id).toBe(allowedChild.id)
    })

    test('should match null values with equals join constraints', async ({ payload }) => {
      const { parent } = await createConstrainedJoinDocuments(payload)
      const childWithoutAvailability = await payload.create({
        collection: accessJoinNotesSlug,
        data: {
          parent,
          title: 'child without availability',
        },
        depth: 0,
        overrideAccess: true,
      })

      const result = await payload.findByID({
        id: parent.id,
        collection: accessJoinParentsSlug,
        depth: 1,
        joins: {
          children: {
            where: {
              availability: {
                equals: null,
              },
            },
          },
        },
        overrideAccess: true,
      })
      const resultReferences = result.children.docs
        .map(({ relationTo, value }) => `${relationTo}:${value.id.toString()}`)
        .sort()

      expect(resultReferences).toEqual([
        `${accessJoinNotesSlug}:${childWithoutAvailability.id.toString()}`,
      ])
    })

    test('should include null values with not_equals join constraints', async ({ payload }) => {
      const { allowedChild, missingAvailabilityChild, parent, partialTagChild } =
        await createConstrainedJoinDocuments(payload)
      const childWithoutAvailability = await payload.create({
        collection: accessJoinNotesSlug,
        data: {
          parent,
          title: 'child without availability',
        },
        depth: 0,
        overrideAccess: true,
      })

      const result = await payload.findByID({
        id: parent.id,
        collection: accessJoinParentsSlug,
        depth: 1,
        joins: {
          children: {
            where: {
              availability: {
                not_equals: 'unavailable',
              },
            },
          },
        },
        overrideAccess: true,
      })
      const resultReferences = result.children.docs
        .map(({ relationTo, value }) => `${relationTo}:${value.id.toString()}`)
        .sort()

      expect(resultReferences).toEqual(
        [
          `${accessJoinArticlesSlug}:${allowedChild.id.toString()}`,
          `${accessJoinNotesSlug}:${childWithoutAvailability.id.toString()}`,
          `${accessJoinNotesSlug}:${missingAvailabilityChild.id.toString()}`,
          `${accessJoinNotesSlug}:${partialTagChild.id.toString()}`,
        ].sort(),
      )
    })

    test('should exclude null values with not_equals null join constraints', async ({
      payload,
    }) => {
      const { allowedChild, missingAvailabilityChild, parent, partialTagChild, restrictedChild } =
        await createConstrainedJoinDocuments(payload)
      const childWithoutAvailability = await payload.create({
        collection: accessJoinNotesSlug,
        data: {
          parent,
          title: 'child without availability',
        },
        depth: 0,
        overrideAccess: true,
      })

      const result = await payload.findByID({
        id: parent.id,
        collection: accessJoinParentsSlug,
        depth: 1,
        joins: {
          children: {
            where: {
              availability: {
                not_equals: null,
              },
            },
          },
        },
        overrideAccess: true,
      })
      const resultReferences = result.children.docs
        .map(({ relationTo, value }) => `${relationTo}:${value.id.toString()}`)
        .sort()

      expect(resultReferences).toEqual(
        [
          `${accessJoinArticlesSlug}:${allowedChild.id.toString()}`,
          `${accessJoinNotesSlug}:${missingAvailabilityChild.id.toString()}`,
          `${accessJoinNotesSlug}:${partialTagChild.id.toString()}`,
          `${accessJoinNotesSlug}:${restrictedChild.id.toString()}`,
        ].sort(),
      )
      expect(resultReferences).not.toContain(
        `${accessJoinNotesSlug}:${childWithoutAvailability.id.toString()}`,
      )
    })

    test('should match null values in in join constraints', async ({ payload }) => {
      const { parent, restrictedChild } = await createConstrainedJoinDocuments(payload)
      const childWithoutAvailability = await payload.create({
        collection: accessJoinNotesSlug,
        data: {
          parent,
          title: 'child without availability',
        },
        depth: 0,
        overrideAccess: true,
      })

      const result = await payload.findByID({
        id: parent.id,
        collection: accessJoinParentsSlug,
        depth: 1,
        joins: {
          children: {
            where: {
              availability: {
                in: ['unavailable', null],
              },
            },
          },
        },
        overrideAccess: true,
      })
      const resultReferences = result.children.docs
        .map(({ relationTo, value }) => `${relationTo}:${value.id.toString()}`)
        .sort()

      expect(resultReferences).toEqual(
        [
          `${accessJoinNotesSlug}:${childWithoutAvailability.id.toString()}`,
          `${accessJoinNotesSlug}:${restrictedChild.id.toString()}`,
        ].sort(),
      )
    })

    test.options(
      'should apply configured operator handlers to null-only in join constraints',
      { db: (adapter) => adapter === 'postgres' },
      async ({ payload }) => {
        const { allowedChild, parent, partialTagChild } =
          await createConstrainedJoinDocuments(payload)
        const childWithoutAvailability = await payload.create({
          collection: accessJoinNotesSlug,
          data: {
            parent,
            title: 'child without availability',
          },
          depth: 0,
          overrideAccess: true,
        })

        const result = await payload.findByID({
          id: parent.id,
          collection: accessJoinParentsSlug,
          depth: 1,
          joins: {
            children: {
              where: {
                availability: {
                  in: [null],
                },
              },
            },
          },
          overrideAccess: true,
        })
        const resultReferences = result.children.docs
          .map(({ relationTo, value }) => `${relationTo}:${value.id.toString()}`)
          .sort()

        expect(resultReferences).toEqual(
          [
            `${accessJoinArticlesSlug}:${allowedChild.id.toString()}`,
            `${accessJoinNotesSlug}:${childWithoutAvailability.id.toString()}`,
            `${accessJoinNotesSlug}:${partialTagChild.id.toString()}`,
          ].sort(),
        )
      },
    )

    test('should apply all operators to has-many select join constraints', async ({ payload }) => {
      const { allowedChild, parent } = await createConstrainedJoinDocuments(payload)

      const result = await payload.findByID({
        id: parent.id,
        collection: accessJoinParentsSlug,
        depth: 1,
        joins: {
          children: {
            where: {
              tags: {
                equals: 'available',
                in: ['allowed-marker'],
              },
            },
          },
        },
        overrideAccess: true,
      })

      expect(result.children.docs).toHaveLength(1)
      expect(result.children.docs[0]?.value.id).toBe(allowedChild.id)
    })

    test.options(
      'should reject polymorphic join access constraints that cannot be applied',
      { db: (adapter) => adapter === 'postgres' },
      async ({ payload }) => {
        const { parent } = await createConstrainedJoinDocuments(payload)

        await expect(
          payload.findByID({
            id: parent.id,
            collection: accessJoinParentsSlug,
            context: { useNearAccessConstraint: true },
            depth: 1,
            overrideAccess: false,
            user,
          }),
        ).rejects.toThrow('The following path cannot be queried: coordinates.near')
      },
    )

    test('should reject polymorphic join constraints for incompatible field shapes', async ({
      payload,
    }) => {
      const { parent } = await createConstrainedJoinDocuments(payload)

      await expect(
        payload.findByID({
          id: parent.id,
          collection: accessJoinParentsSlug,
          context: { useMixedFieldShapeAccessConstraint: true },
          depth: 1,
          overrideAccess: false,
          user,
        }),
      ).rejects.toThrow('The following path cannot be queried: mixedTags.equals')
    })

    test('should apply nested has-many select access constraints', async ({ payload }) => {
      const { parent } = await createConstrainedJoinDocuments(payload)

      const result = await payload.findByID({
        id: parent.id,
        collection: accessJoinParentsSlug,
        context: { useNestedHasManyAccessConstraint: true },
        depth: 1,
        joins: {
          children: {
            count: true,
          },
        },
        overrideAccess: false,
        user,
      })

      expect(result.children.docs).toHaveLength(0)
      expect(result.children.totalDocs).toBe(0)
    })

    test('should match empty nested has-many select fields with exists false', async ({
      payload,
    }) => {
      const { parent } = await createConstrainedJoinDocuments(payload)
      const childWithoutTags = await payload.create({
        collection: accessJoinNotesSlug,
        data: {
          parent,
          title: 'available child',
        },
        depth: 0,
        overrideAccess: true,
      })

      const result = await payload.findByID({
        id: parent.id,
        collection: accessJoinParentsSlug,
        context: { useNestedHasManyAccessConstraint: true },
        depth: 1,
        joins: {
          children: {
            count: true,
          },
        },
        overrideAccess: false,
        user,
      })

      expect(result.children.docs).toHaveLength(1)
      expect(result.children.docs[0]?.relationTo).toBe(accessJoinNotesSlug)
      expect(result.children.docs[0]?.value.id).toBe(childWithoutTags.id)
      expect(result.children.totalDocs).toBe(1)
    })

    test.options(
      'should preserve field-specific operator handling across polymorphic join targets',
      { db: (adapter) => adapter === 'postgres' },
      async ({ payload }) => {
        const parent = await payload.create({
          collection: operatorHandlerJoinParentsSlug,
          data: {},
          depth: 0,
          overrideAccess: true,
        })

        const matchingChild = await payload.create({
          collection: operatorHandlerJoinArticlesSlug,
          data: {
            id: `matching-field-child-${parent.id}`,
            parent,
            title: 'allowed',
          },
          depth: 0,
          overrideAccess: true,
        })
        await payload.create({
          collection: operatorHandlerJoinNotesSlug,
          data: {
            id: `excluded-field-child-${parent.id}`,
            parent,
            title: 'BLOCKED',
          },
          depth: 0,
          overrideAccess: true,
        })

        const result = await payload.findByID({
          id: parent.id,
          collection: operatorHandlerJoinParentsSlug,
          context: { useFieldSpecificOperatorHandlerAccessConstraint: true },
          depth: 1,
          joins: {
            children: {
              count: true,
            },
          },
          overrideAccess: false,
          user,
        })

        expect(result.children.docs).toHaveLength(1)
        expect(result.children.docs[0]?.value.id).toBe(matchingChild.id)
        expect(result.children.totalDocs).toBe(1)
      },
    )

    test('should reject polymorphic join constraints for incompatible nested field shapes', async ({
      payload,
    }) => {
      const { parent } = await createConstrainedJoinDocuments(payload)

      await expect(
        payload.findByID({
          id: parent.id,
          collection: accessJoinParentsSlug,
          context: { useNestedMixedFieldShapeAccessConstraint: true },
          depth: 1,
          overrideAccess: false,
          user,
        }),
      ).rejects.toThrow('The following path cannot be queried: details.mixedTags.equals')
    })

    test('should use exact matching for has-many select contains access constraints', async ({
      payload,
    }) => {
      const { allowedChild, parent, partialTagChild } =
        await createConstrainedJoinDocuments(payload)

      const result = await payload.findByID({
        id: parent.id,
        collection: accessJoinParentsSlug,
        context: { useContainsAccessConstraint: true },
        depth: 1,
        joins: {
          children: {
            count: true,
          },
        },
        overrideAccess: false,
        user,
      })

      const resultIDs = result.children.docs.map(({ value }) =>
        (typeof value === 'object' ? value.id : value).toString(),
      )

      expect(resultIDs).toContain(allowedChild.id.toString())
      expect(resultIDs).not.toContain(partialTagChild.id.toString())
      expect(result.children.totalDocs).toBe(3)
    })

    test('should reject polymorphic join constraints for incompatible scalar field shapes', async ({
      payload,
    }) => {
      const { parent } = await createConstrainedJoinDocuments(payload)

      await expect(
        payload.findByID({
          id: parent.id,
          collection: accessJoinParentsSlug,
          context: { useMixedScalarFieldShapeAccessConstraint: true },
          depth: 1,
          overrideAccess: false,
          user,
        }),
      ).rejects.toThrow('The following path cannot be queried: variantValue.equals')
    })

    test('should filter matching scalar select fields across polymorphic join targets', async ({
      payload,
    }) => {
      const { allowedChild, parent, restrictedChild } =
        await createConstrainedJoinDocuments(payload)

      const result = await payload.findByID({
        id: parent.id,
        collection: accessJoinParentsSlug,
        context: { useScalarSelectAccessConstraint: true },
        depth: 1,
        joins: {
          children: {
            count: true,
          },
        },
        overrideAccess: false,
        user,
      })
      const resultReferences = result.children.docs
        .map(({ relationTo, value }) => `${relationTo}:${value.id.toString()}`)
        .sort()

      expect(resultReferences).toEqual(
        [
          `${accessJoinArticlesSlug}:${allowedChild.id.toString()}`,
          `${accessJoinNotesSlug}:${restrictedChild.id.toString()}`,
        ].sort(),
      )
      expect(result.children.totalDocs).toBe(2)
    })

    test('should reject polymorphic join constraints for localized has-many fields', async ({
      payload,
    }) => {
      const { parent } = await createConstrainedJoinDocuments(payload)

      await expect(
        payload.findByID({
          id: parent.id,
          collection: accessJoinParentsSlug,
          context: { useLocalizedHasManyAccessConstraint: true },
          depth: 1,
          overrideAccess: false,
          user,
        }),
      ).rejects.toThrow('The following path cannot be queried: localizedTags.equals')
    })

    test('should reject polymorphic join constraints for has-many fields in arrays', async ({
      payload,
    }) => {
      const { parent } = await createConstrainedJoinDocuments(payload)

      await expect(
        payload.findByID({
          id: parent.id,
          collection: accessJoinParentsSlug,
          context: { useArrayHasManyAccessConstraint: true },
          depth: 1,
          overrideAccess: false,
          user,
        }),
      ).rejects.toThrow('The following path cannot be queried: items.tags.exists')
    })

    test('should reject unsupported has-many select access operators', async ({ payload }) => {
      const { parent } = await createConstrainedJoinDocuments(payload)

      await expect(
        payload.findByID({
          id: parent.id,
          collection: accessJoinParentsSlug,
          context: { useNotEqualsAccessConstraint: true },
          depth: 1,
          overrideAccess: false,
          user,
        }),
      ).rejects.toThrow('The following path cannot be queried: tags.not_equals')
      await expect(
        payload.findByID({
          id: parent.id,
          collection: accessJoinParentsSlug,
          context: { useNotInAccessConstraint: true },
          depth: 1,
          overrideAccess: false,
          user,
        }),
      ).rejects.toThrow('The following path cannot be queried: tags.not_in')
    })

    test('should return no polymorphic join results for an empty in constraint', async ({
      payload,
    }) => {
      const { parent } = await createConstrainedJoinDocuments(payload)

      const result = await payload.findByID({
        id: parent.id,
        collection: accessJoinParentsSlug,
        context: { useEmptyInAccessConstraint: true },
        depth: 1,
        joins: {
          children: {
            count: true,
          },
        },
        overrideAccess: false,
        user,
      })

      expect(result.children.docs).toHaveLength(0)
      expect(result.children.totalDocs).toBe(0)
    })

    test('should combine multi-value has-many access constraints with sibling fields', async ({
      payload,
    }) => {
      const { allowedChild, parent } = await createConstrainedJoinDocuments(payload)

      const result = await payload.findByID({
        id: parent.id,
        collection: accessJoinParentsSlug,
        context: { useMultipleInAccessConstraint: true },
        depth: 1,
        joins: {
          children: {
            count: true,
          },
        },
        overrideAccess: false,
        user,
      })

      expect(result.children.docs).toHaveLength(1)
      expect(result.children.docs[0]?.value.id).toBe(allowedChild.id)
      expect(result.children.totalDocs).toBe(1)
    })

    test('should support has-many fields that are absent from a joined collection', async ({
      payload,
    }) => {
      const { parent } = await createConstrainedJoinDocuments(payload)

      const result = await payload.findByID({
        id: parent.id,
        collection: accessJoinParentsSlug,
        context: { useMissingHasManyAccessConstraint: true },
        depth: 1,
        joins: {
          children: {
            count: true,
          },
        },
        overrideAccess: false,
        user,
      })

      expect(result.children.docs).toHaveLength(3)
      expect(
        result.children.docs.every(({ relationTo }) => relationTo === accessJoinNotesSlug),
      ).toBe(true)
      expect(result.children.totalDocs).toBe(3)
    })

    test('should support has-many group fields that are absent from a joined collection', async ({
      payload,
    }) => {
      const { parent } = await createConstrainedJoinDocuments(payload)

      const result = await payload.findByID({
        id: parent.id,
        collection: accessJoinParentsSlug,
        context: { useMissingGroupHasManyAccessConstraint: true },
        depth: 1,
        joins: {
          children: {
            count: true,
          },
        },
        overrideAccess: false,
        user,
      })

      expect(result.children.docs).toHaveLength(3)
      expect(
        result.children.docs.every(({ relationTo }) => relationTo === accessJoinNotesSlug),
      ).toBe(true)
      expect(result.children.totalDocs).toBe(3)
    })

    test('should support has-many tab fields that are absent from a joined collection', async ({
      payload,
    }) => {
      const { parent } = await createConstrainedJoinDocuments(payload)

      const result = await payload.findByID({
        id: parent.id,
        collection: accessJoinParentsSlug,
        context: { useMissingTabHasManyAccessConstraint: true },
        depth: 1,
        joins: {
          children: {
            count: true,
          },
        },
        overrideAccess: false,
        user,
      })

      expect(result.children.docs).toHaveLength(3)
      expect(
        result.children.docs.every(({ relationTo }) => relationTo === accessJoinNotesSlug),
      ).toBe(true)
      expect(result.children.totalDocs).toBe(3)
    })

    test('should reject access paths that are absent from every joined collection', async ({
      payload,
    }) => {
      const { parent } = await createConstrainedJoinDocuments(payload)
      const missingPathContexts = [
        {
          context: { useMissingEverywhereAccessConstraint: true },
          path: 'missingTags.exists',
        },
        {
          context: { useMissingGroupEverywhereAccessConstraint: true },
          path: 'details.missingTags.exists',
        },
        {
          context: { useMissingTabEverywhereAccessConstraint: true },
          path: 'articleMeta.missingTags.exists',
        },
      ]

      const results = await Promise.allSettled(
        missingPathContexts.map(({ context }) =>
          payload.findByID({
            id: parent.id,
            collection: accessJoinParentsSlug,
            context,
            depth: 1,
            overrideAccess: false,
            user,
          }),
        ),
      )
      const errorMessages = results.map((result) =>
        result.status === 'rejected' && result.reason instanceof Error
          ? result.reason.message
          : undefined,
      )

      expect(errorMessages).toEqual(
        missingPathContexts.map(({ path }) => `The following path cannot be queried: ${path}`),
      )
    })

    test('should not match flattened field names from another joined collection', async ({
      payload,
    }) => {
      const { allowedChild, parent } = await createConstrainedJoinDocuments(payload)

      const result = await payload.findByID({
        id: parent.id,
        collection: accessJoinParentsSlug,
        context: { useFlattenedFieldCollisionAccessConstraint: true },
        depth: 1,
        joins: {
          children: {
            count: true,
          },
        },
        overrideAccess: false,
        user,
      })

      expect(result.children.docs).toHaveLength(1)
      expect(result.children.docs[0]?.value.id).toBe(allowedChild.id)
      expect(result.children.totalDocs).toBe(1)
    })

    test('should not match nested fields to top-level paths from another joined collection', async ({
      payload,
    }) => {
      const { parent } = await createConstrainedJoinDocuments(payload)

      const result = await payload.findByID({
        id: parent.id,
        collection: accessJoinParentsSlug,
        context: { useReverseFlattenedFieldCollisionAccessConstraint: true },
        depth: 1,
        joins: {
          children: {
            count: true,
          },
        },
        overrideAccess: false,
        user,
      })

      expect(result.children.docs).toHaveLength(3)
      expect(
        result.children.docs.every(({ relationTo }) => relationTo === accessJoinNotesSlug),
      ).toBe(true)
      expect(result.children.totalDocs).toBe(3)
    })

    test('should reject distinct schema paths that share a flattened field name', async ({
      payload,
    }) => {
      const { parent } = await createConstrainedJoinDocuments(payload)

      await expect(
        payload.findByID({
          id: parent.id,
          collection: accessJoinParentsSlug,
          context: { useCombinedFlattenedFieldCollisionAccessConstraint: true },
          depth: 1,
          overrideAccess: false,
          user,
        }),
      ).rejects.toThrow(
        /The following path cannot be queried: (details\.status|details_status)\.equals/,
      )
    })

    test('should filter polymorphic joins by document id', async ({ payload }) => {
      const { allowedChild, children, parent } = await createConstrainedJoinDocuments(payload)
      const matchingChildren = children.filter(({ id }) => id === allowedChild.id)

      const result = await payload.findByID({
        id: parent.id,
        collection: accessJoinParentsSlug,
        context: {
          allowedChildID: allowedChild.id,
          useIDAccessConstraint: true,
        },
        depth: 1,
        joins: {
          children: {
            count: true,
          },
        },
        overrideAccess: false,
        user,
      })

      expect(result.children.docs).toHaveLength(matchingChildren.length)
      expect(result.children.docs.every(({ value }) => value.id === allowedChild.id)).toBe(true)
      expect(result.children.totalDocs).toBe(matchingChildren.length)
    })

    test.options(
      'should apply configured operator handlers to polymorphic join constraints',
      { db: (adapter) => adapter === 'postgres' },
      async ({ payload }) => {
        const { children, parent } = await createConstrainedJoinDocuments(payload)

        const result = await payload.findByID({
          id: parent.id,
          collection: accessJoinParentsSlug,
          context: { useOperatorHandlerAccessConstraint: true },
          depth: 1,
          joins: {
            children: {
              count: true,
            },
          },
          overrideAccess: false,
          user,
        })

        expect(result.children.docs).toHaveLength(children.length - 1)
        expect(result.children.docs.every(({ value }) => value.title !== 'Niño')).toBe(true)
        expect(result.children.totalDocs).toBe(children.length - 1)
      },
    )

    test.options(
      'should apply configured operator handlers to custom IDs in polymorphic join constraints',
      { db: (adapter) => adapter === 'postgres' },
      async ({ payload }) => {
        const parent = await payload.create({
          collection: operatorHandlerJoinParentsSlug,
          data: {},
          depth: 0,
          overrideAccess: true,
        })
        const matchingChild = await payload.create({
          collection: operatorHandlerJoinArticlesSlug,
          data: {
            id: `matching-child-${parent.id}`,
            parent,
          },
          depth: 0,
          overrideAccess: true,
        })
        const excludedChild = await payload.create({
          collection: operatorHandlerJoinNotesSlug,
          data: {
            id: `excluded-child-niño-${parent.id}`,
            parent,
          },
          depth: 0,
          overrideAccess: true,
        })

        const result = await payload.findByID({
          id: parent.id,
          collection: operatorHandlerJoinParentsSlug,
          context: {
            excludedChildID: excludedChild.id.replace('ñ', 'n'),
            useOperatorHandlerIDAccessConstraint: true,
          },
          depth: 1,
          joins: {
            children: {
              count: true,
            },
          },
          overrideAccess: false,
          user,
        })

        expect(result.children.docs).toHaveLength(1)
        expect(result.children.docs[0]?.value.id).toBe(matchingChild.id)
        expect(result.children.totalDocs).toBe(1)
      },
    )

    test.options(
      'should apply configured operator handlers to system IDs in polymorphic join constraints',
      { db: (adapter) => adapter === 'postgres' },
      async ({ payload }) => {
        const { allowedChild, parent } = await createConstrainedJoinDocuments(payload)

        const result = await payload.findByID({
          id: parent.id,
          collection: accessJoinParentsSlug,
          context: {
            excludedChildID: allowedChild.id,
            useSystemIDOperatorHandlerAccessConstraint: true,
          },
          depth: 1,
          joins: {
            children: {
              count: true,
            },
          },
          overrideAccess: false,
          user,
        })

        expect(result.children.docs).toHaveLength(0)
        expect(result.children.totalDocs).toBe(0)
      },
    )

    test('should use exact matching for number like access constraints', async ({ payload }) => {
      const { allowedChild, parent } = await createConstrainedJoinDocuments(payload)

      const result = await payload.findByID({
        id: parent.id,
        collection: accessJoinParentsSlug,
        context: { useNumberLikeAccessConstraint: true },
        depth: 1,
        joins: {
          children: {
            count: true,
          },
        },
        overrideAccess: false,
        user,
      })

      expect(result.children.docs).toHaveLength(1)
      expect(result.children.docs[0]?.value.id).toBe(allowedChild.id)
      expect(result.children.totalDocs).toBe(1)
    })

    test('should reject nested relationship paths in polymorphic join constraints', async ({
      payload,
    }) => {
      const { parent } = await createConstrainedJoinDocuments(payload)

      await expect(
        payload.findByID({
          id: parent.id,
          collection: accessJoinParentsSlug,
          context: { useNestedRelationshipAccessConstraint: true },
          depth: 1,
          overrideAccess: false,
          user,
        }),
      ).rejects.toThrow('The following path cannot be queried: owner.email.exists')
    })

    test('should reject nested JSON paths in polymorphic join constraints', async ({ payload }) => {
      const { parent } = await createConstrainedJoinDocuments(payload)

      await expect(
        payload.findByID({
          id: parent.id,
          collection: accessJoinParentsSlug,
          context: { useNestedJSONAccessConstraint: true },
          depth: 1,
          overrideAccess: false,
          user,
        }),
      ).rejects.toThrow('The following path cannot be queried: settings.approved.exists')
    })

    test('should preserve substring matching in REST join constraints', async ({
      payload,
      restClient,
    }) => {
      const { allowedChild, parent } = await createConstrainedJoinDocuments(payload)

      const result = await restClient
        .GET(`/${accessJoinParentsSlug}/${parent.id}`, {
          query: {
            depth: 1,
            joins: {
              children: {
                where: {
                  title: {
                    contains: 'available',
                  },
                },
              },
            },
          },
        })
        .then((response) => response.json())

      expect(result.children.docs).toHaveLength(1)
      expect(result.children.docs[0]?.value.id).toBe(allowedChild.id)
    })

    test('should apply all access constraints through GraphQL', async ({ payload, restClient }) => {
      const { allowedChild, parent } = await createConstrainedJoinDocuments(payload)
      await payload.create({
        collection: accessJoinArticlesSlug,
        data: {
          availability: 'unavailable',
          parent,
          tags: ['available'],
          title: 'restricted child',
        },
        overrideAccess: true,
      })

      const query = `query {
        AccessJoinParents {
          docs {
            articles(count: true) {
              docs {
                id
              }
              totalDocs
            }
          }
        }
      }`
      const result = await restClient
        .GRAPHQL_POST({ body: JSON.stringify({ query }) })
        .then((response) => response.json())

      expect(result.data.AccessJoinParents.docs[0].articles.docs).toHaveLength(1)
      expect(result.data.AccessJoinParents.docs[0].articles.docs[0].id.toString()).toBe(
        allowedChild.id.toString(),
      )
      expect(result.data.AccessJoinParents.docs[0].articles.totalDocs).toBe(1)
    })

    test('should reject polymorphic joins through GraphQL', async ({ payload, restClient }) => {
      await createConstrainedJoinDocuments(payload)

      const query = `query {
        AccessJoinParents {
          docs {
            children {
              docs
            }
          }
        }
      }`
      const result = await restClient
        .GRAPHQL_POST({ body: JSON.stringify({ query }) })
        .then((response) => response.json())

      expect(result.data.AccessJoinParents.docs[0].children).toBeNull()
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].message).toBe('Something went wrong.')
    })
  })

  test('should support where querying by a top level join field', async ({ payload }) => {
    const category = await payload.create({
      collection: 'categories',
      data: {},
      overrideAccess: true,
    })
    await payload.create({
      collection: 'posts',
      data: { category: category.id, title: 'my-title' },
      overrideAccess: true,
    })
    const found = await payload.find({
      collection: 'categories',
      overrideAccess: true,
      where: { 'relatedPosts.title': { equals: 'my-title' } },
    })

    expect(found.docs).toHaveLength(1)
    expect(found.docs[0].id).toBe(category.id)
  })

  test('should support where querying by a join field as ID', async ({ payload }) => {
    const category = await payload.create({
      collection: 'categories',
      data: {},
      overrideAccess: true,
    })
    const post = await payload.create({
      collection: 'posts',
      data: { category: category.id, title: 'my-title' },
      overrideAccess: true,
    })
    const found_1 = await payload.find({
      collection: 'categories',
      overrideAccess: true,
      where: { 'relatedPosts.id': { equals: post.id } },
    })

    expect(found_1.docs).toHaveLength(1)
    expect(found_1.docs[0].id).toBe(category.id)

    const found_2 = await payload.find({
      collection: 'categories',
      overrideAccess: true,
      where: { relatedPosts: { equals: post.id } },
    })

    expect(found_2.docs).toHaveLength(1)
    expect(found_2.docs[0].id).toBe(category.id)
  })

  test('should support where querying by a join field with hasMany relationship', async ({
    payload,
  }) => {
    const category = await payload.create({
      collection: 'categories',
      data: {},
      overrideAccess: true,
    })
    await payload.create({
      collection: 'posts',
      data: { categories: [category.id], title: 'my-title' },
      overrideAccess: true,
    })

    const found = await payload.find({
      collection: 'categories',
      overrideAccess: true,
      where: { 'hasManyPosts.title': { equals: 'my-title' } },
    })
    expect(found.docs).toHaveLength(1)
    expect(found.docs[0].id).toBe(category.id)
  })

  test('should support where querying by a join field with relationship nested to a group', async ({
    payload,
  }) => {
    const category = await payload.create({
      collection: 'categories',
      data: {},
      overrideAccess: true,
    })
    await payload.create({
      collection: 'posts',
      data: { group: { category: category.id }, title: 'my-category-title' },
      overrideAccess: true,
    })
    const found = await payload.find({
      collection: 'categories',
      overrideAccess: true,
      where: { 'group.relatedPosts.title': { equals: 'my-category-title' } },
    })

    expect(found.docs).toHaveLength(1)
    expect(found.docs[0].id).toBe(category.id)
  })

  test('should support where querying by a join field with relationship nested to an array', async ({
    payload,
  }) => {
    const category = await payload.create({
      collection: 'categories',
      data: {},
      overrideAccess: true,
    })
    const post = await payload.create({
      collection: 'posts',
      data: { array: [{ category: category.id }], title: 'array-join-where-test' },
      overrideAccess: true,
    })
    const found = await payload.find({
      collection: 'categories',
      overrideAccess: true,
      where: { 'arrayPosts.title': { equals: 'array-join-where-test' } },
    })

    expect(found.docs).toHaveLength(1)
    expect(found.docs[0].id).toBe(category.id)

    await payload.delete({ id: post.id, collection: 'posts', overrideAccess: true })
    await payload.delete({ id: category.id, collection: 'categories', overrideAccess: true })
  })

  test('should support where querying by a join field multiple times', async ({ payload }) => {
    const category = await payload.create({
      collection: 'categories',
      data: {},
      overrideAccess: true,
    })
    await payload.create({
      collection: 'posts',
      data: { group: { category: category.id }, isFiltered: true, title: 'my-category-title' },
      overrideAccess: true,
    })

    const found = await payload.find({
      collection: 'categories',
      overrideAccess: true,
      where: {
        and: [
          {
            'group.relatedPosts.title': { equals: 'my-category-title' },
          },
          {
            'group.relatedPosts.title': { exists: true },
          },
          {
            'group.relatedPosts.isFiltered': { equals: true },
          },
        ],
      },
    })

    expect(found.docs).toHaveLength(1)
    expect(found.docs[0].id).toBe(category.id)
  })

  test('should support where querying by a join field with hasMany relationship multiple times', async ({
    payload,
  }) => {
    const category = await payload.create({
      collection: 'categories',
      data: {},
      overrideAccess: true,
    })
    await payload.create({
      collection: 'posts',
      data: { categories: [category.id], isFiltered: true, title: 'my-title' },
      overrideAccess: true,
    })

    const found = await payload.find({
      collection: 'categories',
      overrideAccess: true,
      where: {
        and: [
          {
            'hasManyPosts.title': { equals: 'my-title' },
          },
          {
            'hasManyPosts.title': { exists: true },
          },
          {
            'hasManyPosts.isFiltered': { equals: true },
          },
        ],
      },
    })
    expect(found.docs).toHaveLength(1)
    expect(found.docs[0].id).toBe(category.id)
  })

  test.describe('Polymorphic join query validation', () => {
    test.options(
      'should reject unknown operators and not delay response',
      { db: (adapter) => adapter === 'postgres' },
      async ({ restClient }) => {
        const startTime = Date.now()

        const response = await restClient.GET('/categories', {
          query: {
            joins: {
              polymorphicJoin: {
                limit: 1,
                where: { x: { $raw: 'EXISTS(SELECT 1 FROM pg_sleep(3))' } },
              },
            },
            limit: 1,
          },
        })

        const elapsedSeconds = (Date.now() - startTime) / 1000

        expect(response.status).toBe(400)
        expect(elapsedSeconds).toBeLessThan(1)
      },
    )

    test('should reject unknown operators in polymorphic join where', async ({ restClient }) => {
      const response = await restClient.GET('/categories', {
        query: {
          joins: {
            polymorphicJoin: {
              limit: 1,
              where: { x: { $raw: 'true' } },
            },
          },
          limit: 1,
        },
      })

      expect(response.status).toBe(400)
    })

    test('should allow valid operators in polymorphic join where', async ({ restClient }) => {
      const response = await restClient.GET('/categories', {
        query: {
          joins: {
            polymorphicJoin: {
              limit: 1,
              where: { title: { equals: 'test' } },
            },
          },
          limit: 1,
        },
      })

      expect(response.status).toBe(200)
    })

    test('should reject hidden fields in polymorphic join where', async ({ restClient }) => {
      const response = await restClient.GET('/categories', {
        query: {
          joins: {
            polymorphicJoin: {
              limit: 1,
              where: { hiddenSecret: { equals: 'secret' } },
            },
          },
          limit: 1,
        },
      })

      expect(response.status).toBe(400)
    })

    test('should reject hidden fields in Local API polymorphic join where', async ({ payload }) => {
      await expect(
        payload.find({
          collection: categoriesSlug,
          joins: {
            polymorphicJoin: {
              where: { hiddenSecret: { equals: 'secret' } },
            },
          },
          overrideAccess: false,
          user,
        }),
      ).rejects.toThrow('The following path cannot be queried: hiddenSecret')
    })

    test('should reject access-controlled fields in Local API polymorphic join where', async ({
      payload,
    }) => {
      await expect(
        payload.find({
          collection: categoriesSlug,
          joins: {
            polymorphicJoin: {
              where: { restrictedField: { equals: 'restricted' } },
            },
          },
          overrideAccess: false,
          user,
        }),
      ).rejects.toThrow('The following path cannot be queried: restrictedField')
    })

    test('should reject unknown operators regardless of value type', async ({ restClient }) => {
      const payloads = [
        { title: { bogus_operator: 'primitive' } },
        { title: { not_a_real_op: { nested: 'object' } } },
        { title: { fake: { deeply: { nested: true } } } },
      ]

      for (const where of payloads) {
        const response = await restClient.GET('/categories', {
          query: {
            joins: {
              polymorphicJoin: {
                limit: 1,
                where,
              },
            },
            limit: 1,
          },
        })

        expect(response.status).toBe(400)
      }
    })

    test('should reject unknown operators when value is an array', async ({ restClient }) => {
      // When qs parses [$raw][0]=value, the value becomes an array.
      // Arrays must be rejected the same as other value types.
      const response = await restClient.GET('/categories', {
        query: {
          joins: {
            polymorphicJoin: {
              limit: 1,
              where: { x: { $raw: ['true'] } },
            },
          },
          limit: 1,
        },
      })

      expect(response.status).toBe(400)
    })

    test('should reject disallowed characters in polymorphic join where paths', async ({
      restClient,
    }) => {
      // Polymorphic joins suppress "field not found" errors so that
      // fields unique to one collection are accepted. But paths with
      // disallowed characters must always be rejected.
      const badPaths = [
        "title'",
        "title'; DROP TABLE posts; --",
        'title"bad',
        'title;bad',
        'title(bad',
        'title)bad',
      ]

      for (const path of badPaths) {
        const response = await restClient.GET('/categories', {
          query: {
            joins: {
              polymorphicJoin: {
                limit: 1,
                where: { [path]: { equals: 'test' } },
              },
            },
            limit: 1,
          },
        })

        expect(response.status).toBe(400)
      }
    })

    test('should reject $raw in non-polymorphic join where clause', async ({ restClient }) => {
      // Non-polymorphic joins use the full parseParams pipeline, not
      // buildSQLWhere. The $raw operator must still be rejected.
      const response = await restClient.GET('/categories', {
        query: {
          joins: {
            relatedPosts: {
              limit: 1,
              where: { title: { $raw: 'true' } },
            },
          },
          limit: 1,
        },
      })

      expect(response.status).toBe(400)
    })
  })

  test.describe('Top-level query validation', () => {
    test('should reject $raw operator on top-level collection queries via REST', async ({
      restClient,
    }) => {
      // $raw is an internal-only operator and must be rejected
      // at the top-level collection query as well as in joins.
      const response = await restClient.GET(`/${postsSlug}`, {
        query: {
          limit: 1,
          where: { title: { $raw: 'true' } },
        },
      })

      expect(response.status).toBe(400)
    })

    test('should reject $raw operator via Local API', async ({ payload }) => {
      // The Local API goes through the same validateQueryPaths pipeline.
      await expect(
        payload.find({
          collection: postsSlug,
          limit: 1,
          overrideAccess: true,
          where: { title: { $raw: 'true' } } as any,
        }),
      ).rejects.toBeTruthy()
    })

    test('should reject unknown operators on top-level collection queries', async ({
      restClient,
    }) => {
      const response = await restClient.GET(`/${postsSlug}`, {
        query: {
          limit: 1,
          where: { title: { bogus_operator: 'test' } },
        },
      })

      expect(response.status).toBe(400)
    })

    test('should reject $raw nested inside AND combinator', async ({ restClient }) => {
      // Unrecognized operators inside boolean combinators should
      // also be caught by recursive validation.
      const response = await restClient.GET(`/${postsSlug}`, {
        query: {
          limit: 1,
          where: {
            and: [{ title: { $raw: 'true' } }],
          },
        },
      })

      expect(response.status).toBe(400)
    })

    test('should reject $raw nested inside OR combinator', async ({ restClient }) => {
      const response = await restClient.GET(`/${postsSlug}`, {
        query: {
          limit: 1,
          where: {
            or: [{ title: { $raw: 'true' } }],
          },
        },
      })

      expect(response.status).toBe(400)
    })

    test('should reject $raw nested inside AND combinator in join where', async ({
      restClient,
    }) => {
      const response = await restClient.GET('/categories', {
        query: {
          joins: {
            polymorphicJoin: {
              limit: 1,
              where: {
                and: [{ title: { $raw: 'true' } }],
              },
            },
          },
          limit: 1,
        },
      })

      expect(response.status).toBe(400)
    })
  })
})

async function createPost(
  { payload }: { payload: Payload },
  overrides?: Partial<Post>,
  locale?: Config['locale'],
) {
  return payload.create({
    collection: postsSlug,
    data: {
      title: 'test',
      ...overrides,
    },
    locale,
    overrideAccess: true,
  })
}
