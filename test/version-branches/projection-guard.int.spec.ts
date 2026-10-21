/* eslint-disable payload/no-relative-monorepo-imports -- Verify private query guards against native caller transactions. */
import type { Payload, PayloadRequest } from 'payload'

import { createPayloadRequest } from 'payload'
import { expect } from 'vitest'

import {
  captureBranchProjectionGuard,
  initializeBranchProjectionScope,
  invalidateBranchProjection,
  settleBranchProjectionInvalidation,
  validateBranchProjectionGuard,
} from '../../packages/payload/src/versions/branches/queries/branchProjectionGuard.js'
import { test } from '../__helpers/int/vitest.js'
import { nativeBranchDatabaseOptions } from './adapterCapabilities.js'

const control = { invalidations: 'branch-query-invalidations', states: 'branch-query-states' }
const scope = { locale: 'en', type: 'locale' as const }
const branchID = 'staging'

test.suite('Derived branch query guards', { config: './config.ts' }, () => {
  test('should refuse an uninitialized branch before querying content', async ({ payload }) => {
    const req = await createPayloadRequest({ payload })

    await expect(
      captureBranchProjectionGuard({ branchID, control, req, scopes: [scope] }),
    ).rejects.toMatchObject({
      code: 'branch-projection-not-ready',
    })
  })

  test.options(
    'should retain an earlier dirty identity when a later identity rebuild finishes',
    nativeBranchDatabaseOptions,
    async ({ payload }) => {
      await inTransaction({
        payload,
        run: async ({ req }) => {
          await initializeBranchProjectionScope({ branchID, control, req, scope })
          const first = await invalidateBranchProjection({
            branchID,
            control,
            logicalID: 1,
            req,
            scope,
          })
          const second = await invalidateBranchProjection({
            branchID,
            control,
            logicalID: 2,
            req,
            scope,
          })

          await settleBranchProjectionInvalidation({ control, expected: second, req })

          await expect(
            captureBranchProjectionGuard({ branchID, control, req, scopes: [scope] }),
          ).rejects.toMatchObject({ code: 'branch-projection-not-ready' })
          expect(
            (await payload.db.find({ collection: control.invalidations, req })).docs,
          ).toMatchObject([{ identityKey: first.identityKey }])

          await settleBranchProjectionInvalidation({ control, expected: first, req })
          const guard = await captureBranchProjectionGuard({
            branchID,
            control,
            req,
            scopes: [scope],
          })

          await validateBranchProjectionGuard({ guard, req })
        },
      })
    },
  )

  test.options(
    'should reject a rebuild captured before another invalidation of the same identity',
    nativeBranchDatabaseOptions,
    async ({ payload }) => {
      await inTransaction({
        payload,
        run: async ({ req }) => {
          const first = await invalidateBranchProjection({
            branchID,
            control,
            logicalID: 1,
            req,
            scope,
          })
          const second = await invalidateBranchProjection({
            branchID,
            control,
            logicalID: 1,
            req,
            scope,
          })

          await expect(
            settleBranchProjectionInvalidation({ control, expected: first, req }),
          ).rejects.toMatchObject({ code: 'branch-projection-conflict' })
          expect(second.revision).toBe(first.revision + 1)
          expect(
            (await payload.db.find({ collection: control.states, req })).docs[0],
          ).toMatchObject({ pendingCount: 1 })
        },
      })
    },
  )

  test.options(
    'should reject a stale rebuild after queue settlement and recreation',
    nativeBranchDatabaseOptions,
    async ({ payload }) => {
      let first: Awaited<ReturnType<typeof invalidateBranchProjection>>

      await inTransaction({
        payload,
        run: async ({ req }) => {
          first = await invalidateBranchProjection({ branchID, control, logicalID: 1, req, scope })
          await settleBranchProjectionInvalidation({ control, expected: first, req })
        },
      })

      await inTransaction({
        payload,
        run: async ({ req }) => {
          const recreated = await invalidateBranchProjection({
            branchID,
            control,
            logicalID: 1,
            req,
            scope,
          })

          expect(recreated.revision).toBe(first.revision)
          expect(recreated.lifetime).not.toBe(first.lifetime)
          await expect(
            settleBranchProjectionInvalidation({ control, expected: first, req }),
          ).rejects.toMatchObject({ code: 'branch-projection-conflict' })
          expect(
            (await payload.db.find({ collection: control.states, req })).docs[0],
          ).toMatchObject({ pendingCount: 1 })
        },
      })
    },
  )

  test.options(
    'should keep structural conflict errors scoped to the requested locale',
    nativeBranchDatabaseOptions,
    async ({ payload }) => {
      await inTransaction({
        payload,
        run: async ({ req }) => {
          const french = { locale: 'fr', type: 'locale' as const }

          await initializeBranchProjectionScope({ branchID, control, req, scope })
          await initializeBranchProjectionScope({ branchID, control, req, scope: french })
          const invalidation = await invalidateBranchProjection({
            branchID,
            control,
            logicalID: 1,
            req,
            scope: french,
          })

          await settleBranchProjectionInvalidation({
            control,
            expected: invalidation,
            hasStructuralConflict: true,
            req,
          })
          await expect(
            captureBranchProjectionGuard({ branchID, control, req, scopes: [french] }),
          ).rejects.toMatchObject({ code: 'branch-structural-conflict' })
          await expect(
            captureBranchProjectionGuard({ branchID, control, req, scopes: [scope] }),
          ).resolves.toHaveProperty('observations')

          const recovered = await invalidateBranchProjection({
            branchID,
            control,
            logicalID: 1,
            req,
            scope: french,
          })

          await settleBranchProjectionInvalidation({ control, expected: recovered, req })
          await expect(
            captureBranchProjectionGuard({ branchID, control, req, scopes: [french] }),
          ).resolves.toHaveProperty('observations')
        },
      })
    },
  )

  test.options(
    'should invalidate an earlier clean read even when replacement finishes clean',
    nativeBranchDatabaseOptions,
    async ({ payload }) => {
      await inTransaction({
        payload,
        run: async ({ req }) => {
          await initializeBranchProjectionScope({ branchID, control, req, scope })
          const guard = await captureBranchProjectionGuard({
            branchID,
            control,
            req,
            scopes: [scope],
          })
          const invalidation = await invalidateBranchProjection({
            branchID,
            control,
            logicalID: 1,
            req,
            scope,
          })

          await settleBranchProjectionInvalidation({ control, expected: invalidation, req })
          await expect(validateBranchProjectionGuard({ guard, req })).rejects.toMatchObject({
            code: 'branch-projection-conflict',
          })
        },
      })
    },
  )

  test.options(
    'should roll back invalidation rows and generation together',
    nativeBranchDatabaseOptions,
    async ({ payload }) => {
      await inTransaction({
        payload,
        run: ({ req }) => initializeBranchProjectionScope({ branchID, control, req, scope }),
      })
      const req = await createPayloadRequest({ payload })
      const guard = await captureBranchProjectionGuard({ branchID, control, req, scopes: [scope] })

      await expect(
        inTransaction({
          payload,
          run: async ({ req: mutationReq }) => {
            await invalidateBranchProjection({
              branchID,
              control,
              logicalID: 1,
              req: mutationReq,
              scope,
            })
            throw new Error('Abort derived query replacement')
          },
        }),
      ).rejects.toThrow('Abort derived query replacement')

      await expect(validateBranchProjectionGuard({ guard, req })).resolves.toBeUndefined()
      expect((await payload.db.find({ collection: control.invalidations })).docs).toHaveLength(0)
    },
  )
})

const inTransaction = async <T>({
  payload,
  run,
}: {
  payload: Payload
  run: (args: { req: PayloadRequest }) => Promise<T>
}): Promise<T> => {
  const req = await createPayloadRequest({ payload })
  const transactionID = await payload.db.beginTransaction()

  if (transactionID == null) {
    throw new Error('Query guard tests require native transactions.')
  }

  req.transactionID = transactionID

  try {
    const result = await run({ req })

    await payload.db.commitTransaction(transactionID)
    return result
  } catch (error) {
    await payload.db.rollbackTransaction(transactionID)
    throw error
  }
}
