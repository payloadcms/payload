import type { PayloadRequest } from 'payload'

import { commitTransaction, createPayloadRequest, initTransaction, killTransaction } from 'payload'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { postsSlug } from './shared.js'

test.suite('Database batch processing', { config: './config.ts' }, () => {
  test('should execute mixed operations and return ordered storage outcomes', async ({
    payload,
  }) => {
    const postToUpdate = await payload.create({
      collection: postsSlug,
      data: { title: 'update me' },
      overrideAccess: true,
    })
    const postToDelete = await payload.create({
      collection: postsSlug,
      data: { title: 'delete me' },
      overrideAccess: true,
    })
    const req = { payload } as PayloadRequest

    const results = await payload.db.batchProcessing({
      batchSize: 2,
      operations: [
        {
          args: {
            collection: postsSlug,
            data: { title: 'created in batch' },
            returning: false,
          },
          operation: 'create',
        },
        {
          args: {
            id: postToUpdate.id,
            collection: postsSlug,
            data: { title: 'updated in batch' },
            returning: false,
          },
          operation: 'updateOne',
        },
        {
          args: {
            collection: postsSlug,
            data: { title: 'never applied' },
            returning: false,
            where: { title: { equals: 'not present' } },
          },
          operation: 'updateOne',
        },
        {
          args: {
            collection: postsSlug,
            returning: false,
            where: { id: { equals: postToDelete.id } },
          },
          operation: 'deleteOne',
        },
      ],
      req,
    })

    expect(results).toEqual([
      {
        documentID: expect.anything(),
        index: 0,
        operation: 'create',
        status: 'succeeded',
      },
      {
        documentID: postToUpdate.id,
        index: 1,
        operation: 'updateOne',
        status: 'succeeded',
      },
      {
        index: 2,
        operation: 'updateOne',
        status: 'noMatch',
      },
      {
        documentID: postToDelete.id,
        index: 3,
        operation: 'deleteOne',
        status: 'succeeded',
      },
    ])

    const storedPosts = await payload.find({
      collection: postsSlug,
      limit: 0,
      overrideAccess: true,
      where: {
        title: {
          in: ['created in batch', 'updated in batch', 'delete me', 'never applied'],
        },
      },
    })

    expect(storedPosts.docs.map(({ title }) => title).sort()).toEqual([
      'created in batch',
      'updated in batch',
    ])
    expect(req.transactionID).toBeUndefined()
  })

  test.options(
    'should leave commit and rollback to the caller transaction',
    { db: (adapter) => adapter === 'mongodb' || adapter === 'postgres' },
    async ({ payload }) => {
      const rollbackReq = await createPayloadRequest({ payload })
      const didStartRollbackTransaction = await initTransaction(rollbackReq)
      const rollbackTransactionID = await rollbackReq.transactionID

      expect(didStartRollbackTransaction).toBe(true)

      try {
        const rollbackResults = await payload.db.batchProcessing({
          operations: [
            {
              args: { collection: postsSlug, data: { title: 'rolled back batch post' } },
              operation: 'create',
            },
          ],
          req: rollbackReq,
        })

        expect(rollbackResults[0]).toMatchObject({ operation: 'create', status: 'succeeded' })
        expect(rollbackReq.transactionID).toBe(rollbackTransactionID)
      } finally {
        if (rollbackReq.transactionID) {
          await killTransaction(rollbackReq)
        }
      }

      const afterRollback = await payload.find({
        collection: postsSlug,
        overrideAccess: true,
        where: { title: { equals: 'rolled back batch post' } },
      })

      expect(afterRollback.docs).toHaveLength(0)

      const commitReq = await createPayloadRequest({ payload })
      const didStartCommitTransaction = await initTransaction(commitReq)
      const commitTransactionID = await commitReq.transactionID

      expect(didStartCommitTransaction).toBe(true)

      try {
        const commitResults = await payload.db.batchProcessing({
          operations: [
            {
              args: { collection: postsSlug, data: { title: 'committed batch post' } },
              operation: 'create',
            },
          ],
          req: commitReq,
        })

        expect(commitResults[0]).toMatchObject({ operation: 'create', status: 'succeeded' })
        expect(commitReq.transactionID).toBe(commitTransactionID)

        await commitTransaction(commitReq)
      } finally {
        if (commitReq.transactionID) {
          await killTransaction(commitReq)
        }
      }

      const afterCommit = await payload.find({
        collection: postsSlug,
        overrideAccess: true,
        where: { title: { equals: 'committed batch post' } },
      })

      expect(afterCommit.docs).toHaveLength(1)
    },
  )

  test.options(
    'should stop a later group failure without resolving the caller transaction',
    { db: (adapter) => adapter === 'mongodb' || adapter === 'postgres' },
    async ({ payload }) => {
      const existing = await payload.create({
        collection: postsSlug,
        data: { title: 'existing batch post' },
        overrideAccess: true,
      })
      const req = await createPayloadRequest({ payload })
      const didStartTransaction = await initTransaction(req)
      const callerTransactionID = await req.transactionID

      expect(didStartTransaction).toBe(true)

      try {
        const results = await payload.db.batchProcessing({
          batchSize: 1,
          operations: [
            {
              args: { collection: postsSlug, data: { title: 'first batch group' } },
              operation: 'create',
            },
            {
              args: {
                collection: postsSlug,
                customID: existing.id,
                data: { title: 'duplicate batch group' },
              },
              operation: 'create',
            },
            {
              args: { collection: postsSlug, data: { title: 'unattempted batch group' } },
              operation: 'create',
            },
          ],
          req,
        })

        expect(results[0]).toMatchObject({ operation: 'create', status: 'succeeded' })
        expect(results[1]).toMatchObject({ operation: 'create', status: 'failed' })
        expect(results[2]).toEqual({ index: 2, operation: 'create', status: 'unattempted' })
        expect(req.transactionID).toBe(callerTransactionID)
      } finally {
        if (req.transactionID) {
          await killTransaction(req)
        }
      }

      const afterRollback = await payload.find({
        collection: postsSlug,
        overrideAccess: true,
        where: { title: { in: ['first batch group', 'unattempted batch group'] } },
      })

      expect(afterRollback.docs).toHaveLength(0)
    },
  )
})
