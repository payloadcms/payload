import type { PayloadRequest } from 'payload'

import { describe, expect, it, vi } from 'vitest'

import type { DrizzleAdapter } from '../types.js'

import { createDrizzleBranchingAdapter } from './createDrizzleBranchingAdapter.js'

describe('Drizzle branch transaction boundary', () => {
  it.each([
    { isTransactionConfigured: true, hasRuntimeTransactions: true, expected: true },
    { isTransactionConfigured: false, hasRuntimeTransactions: true, expected: false },
    { isTransactionConfigured: true, hasRuntimeTransactions: false, expected: false },
  ])(
    'should require configuration and runtime transaction support: $expected',
    async ({ isTransactionConfigured, hasRuntimeTransactions, expected }) => {
      const adapter = {
        drizzle: hasRuntimeTransactions ? { transaction: vi.fn() } : {},
      } as unknown as DrizzleAdapter
      const branching = createDrizzleBranchingAdapter({ adapter, isTransactionConfigured })

      expect(await branching.capabilities({})).toMatchObject({
        interactiveTransactions: expected,
        atomicBatch: false,
      })
    },
  )

  it.each([undefined, 'expired', Promise.resolve('expired')])(
    'should reject missing or expired caller sessions',
    async (transactionID) => {
      const transaction = vi.fn()
      const adapter = { drizzle: { transaction }, sessions: {} } as unknown as DrizzleAdapter
      const branching = createDrizzleBranchingAdapter({ adapter, isTransactionConfigured: true })

      await expect(
        branching.mutateVersion({
          entity: { type: 'collection', slug: 'posts', parentID: 1 },
          expected: { id: 1, generation: 0 },
          mutation: { type: 'initialize', isFrozen: true, ownerKey: 'head' },
          req: { transactionID } as PayloadRequest,
        }),
      ).rejects.toThrow('active caller transaction')
      expect(transaction).not.toHaveBeenCalled()
    },
  )
})
