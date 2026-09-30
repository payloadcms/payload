/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test", "test.options"] }] -- Tests use the shared fixture wrapper. */

import { createPayloadRequest } from 'payload'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import {
  branchChangesSlug,
  branchesSlug,
  categoriesSlug,
  headerGlobalSlug,
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
        _branchOp: 'update',
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
