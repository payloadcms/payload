import { expect, vi } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { branchesSlug, branchMergesSlug, postsSlug } from './shared.js'

test.suite(
  'Branching: SQLite transactions',
  { config: './sqlite-transactions.config.ts', db: (adapter) => adapter === 'sqlite' },
  () => {
    test('should merge multiple changes without opening a competing ledger transaction', async ({
      payload,
    }) => {
      const branch = await payload.create({
        collection: branchesSlug,
        data: { name: 'sqlite-merge' },
        overrideAccess: true,
      })

      for (const title of ['First post', 'Second post']) {
        await payload.create({
          branch: branch.name,
          collection: postsSlug,
          data: { title },
          overrideAccess: true,
        })
      }

      const result = await payload.branches.merge({ branch: branch.name, overrideAccess: true })
      const mainPosts = await payload.find({ collection: postsSlug, overrideAccess: true })
      const events = await payload.find({ collection: branchMergesSlug, overrideAccess: true })
      const mergedBranch = await payload.findByID({
        id: branch.id,
        collection: branchesSlug,
        overrideAccess: true,
      })

      expect(result.merged).toHaveLength(2)
      expect(mainPosts.docs.map(({ title }) => title).sort()).toEqual(['First post', 'Second post'])
      expect(mergedBranch.status).toBe('merged')
      expect(events.docs).toHaveLength(1)
      expect(events.docs[0].status).toBe('succeeded')
    })

    test('should reopen the branch and allow retry after a merge write fails', async ({
      payload,
    }) => {
      const branch = await payload.create({
        collection: branchesSlug,
        data: { name: 'sqlite-retry' },
        overrideAccess: true,
      })

      for (const title of ['First retry post', 'Second retry post']) {
        await payload.create({
          branch: branch.name,
          collection: postsSlug,
          data: { title },
          overrideAccess: true,
        })
      }

      const error = new Error('Merge interrupted after writing')

      await expect(
        payload.branches.merge({
          branch: branch.name,
          onProgress: ({ current }) => {
            if (current === 2) {
              throw error
            }
          },
          overrideAccess: true,
        }),
      ).rejects.toBe(error)

      const restoredBranch = await payload.findByID({
        id: branch.id,
        collection: branchesSlug,
        overrideAccess: true,
      })
      const mainPosts = await payload.find({ collection: postsSlug, overrideAccess: true })
      const events = await payload.find({ collection: branchMergesSlug, overrideAccess: true })

      expect(restoredBranch.status).toBe('open')
      expect(mainPosts.docs).toHaveLength(0)
      expect(events.docs[0].status).toBe('failed')

      const result = await payload.branches.merge({ branch: branch.name, overrideAccess: true })

      expect(result.merged).toHaveLength(2)
    })

    test('should record a transaction startup failure and allow retry', async ({ payload }) => {
      const branch = await payload.create({
        collection: branchesSlug,
        data: { name: 'sqlite-begin-failure' },
        overrideAccess: true,
      })

      await payload.create({
        branch: branch.name,
        collection: postsSlug,
        data: { title: 'Retry after failed BEGIN' },
        overrideAccess: true,
      })

      const error = new Error('SQLITE_BUSY: database is locked')
      const beginTransaction = payload.db.beginTransaction.bind(payload.db)
      const beginSpy = vi
        .spyOn(payload.db, 'beginTransaction')
        .mockImplementationOnce(beginTransaction)
        .mockRejectedValueOnce(error)

      try {
        await expect(
          payload.branches.merge({ branch: branch.name, overrideAccess: true }),
        ).rejects.toBe(error)
      } finally {
        beginSpy.mockRestore()
      }

      const restoredBranch = await payload.findByID({
        id: branch.id,
        collection: branchesSlug,
        overrideAccess: true,
      })
      const events = await payload.find({ collection: branchMergesSlug, overrideAccess: true })

      expect(restoredBranch.status).toBe('open')
      expect(events.docs[0].status).toBe('failed')
      expect(events.docs[0].error).toBe(error.message)

      const result = await payload.branches.merge({ branch: branch.name, overrideAccess: true })

      expect(result.merged).toHaveLength(1)
    })
  },
)
