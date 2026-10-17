/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test", "test.options"] }] -- Tests use the shared fixture wrapper. */

import { createPayloadRequest } from 'payload'
import { expect, vi } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import {
  branchChangesSlug,
  branchesSlug,
  categoriesSlug,
  headerGlobalSlug,
  pagesSlug,
  postsSlug,
} from './shared.js'

test.suite('Branching database isolation', { config: './config.ts' }, () => {
  test('should return the branch global when an include select omits branch bookkeeping', async ({
    payload,
  }) => {
    const branch = await payload.create({
      collection: branchesSlug,
      data: { name: 'Zulu Global Select Branch' },
      overrideAccess: true,
    })

    await payload.updateGlobal({
      slug: headerGlobalSlug,
      data: { navLabel: 'main navigation' },
      overrideAccess: true,
    })
    await payload.updateGlobal({
      slug: headerGlobalSlug,
      branch: branch.slug,
      data: { navLabel: 'branch navigation' },
      overrideAccess: true,
    })

    const result = await payload.findGlobal({
      slug: headerGlobalSlug,
      branch: branch.slug,
      overrideAccess: true,
      select: { navLabel: true },
    })

    expect(result.navLabel).toBe('branch navigation')
  })

  test('should use branch related values for relationship-path distinct reads', async ({
    payload,
  }) => {
    const branch = await payload.create({
      collection: branchesSlug,
      data: { name: 'Related Distinct Branch' },
      overrideAccess: true,
    })
    const category = await payload.create({
      collection: categoriesSlug,
      data: { name: 'main category' },
      overrideAccess: true,
    })

    await payload.create({
      collection: postsSlug,
      data: { category: category.id, title: 'post' },
      overrideAccess: true,
    })
    await payload.db.create({
      collection: categoriesSlug,
      data: {
        name: 'branch category',
        _branch: branch.slug,
        _branchDocID: category.id,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      },
      req: await createPayloadRequest({ payload }),
    })

    await payload.create({
      collection: branchChangesSlug,
      data: {
        baseUpdatedAt: category.updatedAt,
        branch: branch.slug,
        collectionSlug: categoriesSlug,
        doc: { relationTo: categoriesSlug, value: category.id },
        documentID: String(category.id),
        entityType: 'collection',
        operation: 'update',
      },
      overrideAccess: true,
    })

    const result = await payload.findDistinct({
      branch: branch.slug,
      collection: postsSlug,
      field: 'category.name',
      overrideAccess: true,
    })

    expect(result.values).toEqual([{ 'category.name': 'branch category' }])
  })

  test('should use database-native branch visibility for reads and joins', async ({ payload }) => {
    const warningSpy = vi.spyOn(payload.logger, 'warn')

    try {
      const branch = await payload.create({
        collection: branchesSlug,
        data: { name: 'Native Visibility Branch' },
        overrideAccess: true,
      })
      const category = await payload.create({
        collection: categoriesSlug,
        data: { name: 'visibility category' },
        overrideAccess: true,
      })
      const first = await payload.create({
        collection: postsSlug,
        data: { category: category.id, title: 'main first' },
        overrideAccess: true,
      })
      const second = await payload.create({
        collection: postsSlug,
        data: { category: category.id, title: 'main second' },
        overrideAccess: true,
      })
      const deleted = await payload.create({
        collection: postsSlug,
        data: { category: category.id, title: 'main deleted' },
        overrideAccess: true,
      })
      const untouched = await payload.create({
        collection: postsSlug,
        data: { category: category.id, title: 'untouched' },
        overrideAccess: true,
      })

      await payload.update({
        id: first.id,
        branch: branch.slug,
        collection: postsSlug,
        data: { title: 'branch first' },
        overrideAccess: true,
      })
      await payload.update({
        id: second.id,
        branch: branch.slug,
        collection: postsSlug,
        data: { title: 'branch second' },
        overrideAccess: true,
      })
      await payload.delete({
        id: deleted.id,
        branch: branch.slug,
        collection: postsSlug,
        overrideAccess: true,
      })
      const created = await payload.create({
        branch: branch.slug,
        collection: postsSlug,
        data: { category: category.id, title: 'branch created' },
        overrideAccess: true,
      })

      warningSpy.mockClear()

      const firstPage = await payload.find({
        branch: branch.slug,
        collection: postsSlug,
        limit: 2,
        overrideAccess: true,
        page: 1,
        sort: 'title',
      })
      const secondPage = await payload.find({
        branch: branch.slug,
        collection: postsSlug,
        limit: 2,
        overrideAccess: true,
        page: 2,
        sort: 'title',
      })
      const counted = await payload.count({
        branch: branch.slug,
        collection: postsSlug,
        overrideAccess: true,
      })
      const foundByID = await payload.findByID({
        id: second.id,
        branch: branch.slug,
        collection: postsSlug,
        overrideAccess: true,
      })
      const categoryWithPosts = await payload.findByID({
        id: category.id,
        branch: branch.slug,
        collection: categoriesSlug,
        joins: {
          posts: { count: true, limit: 10, sort: 'title' },
        },
        overrideAccess: true,
      })

      const visibleDocs = [...firstPage.docs, ...secondPage.docs]
      const visibleTitles = visibleDocs.map((doc) => doc.title)

      expect(visibleTitles).toEqual([
        'branch created',
        'branch first',
        'branch second',
        'untouched',
      ])
      expect(visibleDocs.map((doc) => String(doc.id))).toEqual([
        String(created.id),
        String(first.id),
        String(second.id),
        String(untouched.id),
      ])
      expect(firstPage.totalDocs).toBe(4)
      expect(secondPage.totalDocs).toBe(4)
      expect(counted.totalDocs).toBe(4)
      expect(foundByID.title).toBe('branch second')
      expect(foundByID.id).toBe(second.id)
      expect(categoryWithPosts.posts.totalDocs).toBe(4)
      expect(categoryWithPosts.posts.docs.map((doc) => doc.title)).toEqual(visibleTitles)

      const versionedMainDocs = await Promise.all(
        ['versioned first', 'versioned second'].map((title) =>
          payload.create({
            collection: pagesSlug,
            data: { title },
            draft: true,
            overrideAccess: true,
          }),
        ),
      )

      for (const [index, doc] of versionedMainDocs.entries()) {
        await payload.update({
          id: doc.id,
          branch: branch.slug,
          collection: pagesSlug,
          data: { title: `branch versioned ${index + 1}` },
          draft: true,
          overrideAccess: true,
        })
      }

      warningSpy.mockClear()

      const versionedOnBranch = await payload.find({
        branch: branch.slug,
        collection: pagesSlug,
        draft: true,
        overrideAccess: true,
        sort: 'title',
      })

      expect(versionedOnBranch.docs.map((doc) => doc.title)).toEqual([
        'branch versioned 1',
        'branch versioned 2',
      ])
      expect(versionedOnBranch.totalDocs).toBe(2)
      expect(warningSpy).not.toHaveBeenCalledWith(expect.stringContaining('above maxShadowedIDs'))
    } finally {
      warningSpy.mockRestore()
    }
  })

  test('should use canonical distinct IDs for selection, ordering, and counting', async ({
    payload,
  }) => {
    const branch = await payload.create({
      collection: branchesSlug,
      data: { name: 'Canonical Distinct Branch' },
      overrideAccess: true,
    })
    const first = await payload.create({
      collection: postsSlug,
      data: { title: 'first' },
      overrideAccess: true,
    })
    const second = await payload.create({
      collection: postsSlug,
      data: { title: 'second' },
      overrideAccess: true,
    })
    const deleted = await payload.create({
      collection: postsSlug,
      data: { title: 'deleted' },
      overrideAccess: true,
    })

    await payload.update({
      id: first.id,
      branch: branch.slug,
      collection: postsSlug,
      data: { title: 'branch first' },
      overrideAccess: true,
    })
    await payload.delete({
      id: deleted.id,
      branch: branch.slug,
      collection: postsSlug,
      overrideAccess: true,
    })
    const created = await payload.create({
      branch: branch.slug,
      collection: postsSlug,
      data: { title: 'branch created' },
      overrideAccess: true,
    })

    const firstPage = await payload.findDistinct({
      branch: branch.slug,
      collection: postsSlug,
      field: 'id',
      limit: 2,
      overrideAccess: true,
      page: 1,
      sort: 'id',
    })
    const secondPage = await payload.findDistinct({
      branch: branch.slug,
      collection: postsSlug,
      field: 'id',
      limit: 2,
      overrideAccess: true,
      page: 2,
      sort: 'id',
    })
    const expectedIDs = [first.id, second.id, created.id].toSorted((left, right) =>
      typeof left === 'number' && typeof right === 'number'
        ? left - right
        : String(left).localeCompare(String(right)),
    )

    expect([...firstPage.values, ...secondPage.values].map(({ id }) => id)).toEqual(expectedIDs)
    expect(firstPage.totalDocs).toBe(3)
    expect(secondPage.totalDocs).toBe(3)
    expect(firstPage.totalPages).toBe(2)
    expect(secondPage.totalPages).toBe(2)
  })

  test.options(
    'should use database-native visibility for Drizzle version history',
    { db: 'drizzle' },
    async ({ payload }) => {
      const branch = await payload.create({
        collection: branchesSlug,
        data: { name: 'Native History Visibility Branch' },
        overrideAccess: true,
      })
      const page = await payload.create({
        collection: pagesSlug,
        data: { title: 'history on main' },
        draft: true,
        overrideAccess: true,
      })

      await payload.update({
        id: page.id,
        branch: branch.slug,
        collection: pagesSlug,
        data: { title: 'history on branch' },
        draft: true,
        overrideAccess: true,
      })
      await payload.update({
        id: page.id,
        collection: pagesSlug,
        data: { title: 'later history on main' },
        draft: true,
        overrideAccess: true,
      })

      const databaseFind = payload.db.find.bind(payload.db)
      let branchChangeQueries = 0
      const findSpy = vi.spyOn(payload.db, 'find').mockImplementation(async (args) => {
        if (args.collection === branchChangesSlug) {
          branchChangeQueries += 1
        }

        return databaseFind(args)
      })

      try {
        const history = await payload.findVersions({
          branch: branch.slug,
          collection: pagesSlug,
          overrideAccess: true,
          pagination: false,
          where: { parent: { equals: page.id } },
        })
        const count = await payload.countVersions({
          branch: branch.slug,
          collection: pagesSlug,
          overrideAccess: true,
          where: { parent: { equals: page.id } },
        })

        expect(history.docs.map((version) => version.version?.title)).not.toContain(
          'later history on main',
        )
        expect(count.totalDocs).toBe(history.docs.length)
        expect(branchChangeQueries).toBe(0)
      } finally {
        findSpy.mockRestore()
      }
    },
  )

  test.options(
    'should update only the main global row when branch copies exist',
    { db: 'mongo' },
    async ({ payload }) => {
      const branch = await payload.create({
        collection: branchesSlug,
        data: { name: 'Mongo Global Update Branch' },
        overrideAccess: true,
      })

      await payload.updateGlobal({
        slug: headerGlobalSlug,
        data: { navLabel: 'main before update' },
        overrideAccess: true,
      })
      await payload.updateGlobal({
        slug: headerGlobalSlug,
        branch: branch.slug,
        data: { navLabel: 'branch before update' },
        overrideAccess: true,
      })

      const globalsModel = payload.db.globals
      const mainRow = await globalsModel
        .findOne({ _branch: 'main', globalType: headerGlobalSlug })
        .lean()

      if (!mainRow) {
        throw new Error('Expected the main global row to exist')
      }

      await globalsModel.collection.deleteOne({ _id: mainRow._id })
      await globalsModel.collection.insertOne(mainRow)

      await payload.updateGlobal({
        slug: headerGlobalSlug,
        data: { navLabel: 'main after update' },
        overrideAccess: true,
      })

      const main = await payload.findGlobal({
        slug: headerGlobalSlug,
        overrideAccess: true,
      })
      const onBranch = await payload.findGlobal({
        slug: headerGlobalSlug,
        branch: branch.slug,
        overrideAccess: true,
      })

      expect(main.navLabel).toBe('main after update')
      expect(onBranch.navLabel).toBe('branch before update')
    },
  )
})
