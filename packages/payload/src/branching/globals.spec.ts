import type { PayloadRequest } from '../types/index.js'

import { expect, test, vi } from 'vitest'

import { runTransactionRollbackCallbacks } from '../utilities/transactionCallbacks.js'
import { recordBranchGlobalChange } from './globals.js'

test('should reopen a merged branch after fallback global registration', async () => {
  const update = vi.fn(async () => ({ id: 'branch-id', status: 'open' }))
  const req = {
    context: {},
    payload: {
      db: {},
      find: vi.fn(async ({ collection }) => ({
        docs: collection === 'payload-branches' ? [{ id: 'branch-id', status: 'merged' }] : [],
      })),
      create: vi.fn(),
      update,
    },
  } as unknown as PayloadRequest

  await recordBranchGlobalChange({ branch: 'campaign', globalSlug: 'settings', req })

  expect(update).toHaveBeenCalledWith(
    expect.objectContaining({
      collection: 'payload-branches',
      data: { mergedAt: null, status: 'open' },
    }),
  )
})

test('should register the pair again after its transaction rolls back', async () => {
  const upsertBranchGlobalChange = vi.fn()
  const req = {
    transactionID: 'transaction',
    context: {},
    payload: {
      db: { upsertBranchGlobalChange },
      find: vi.fn(async () => ({ docs: [{ id: 'branch-id', status: 'open' }] })),
    },
  } as unknown as PayloadRequest

  await recordBranchGlobalChange({ branch: 'campaign', globalSlug: 'settings', req })
  await recordBranchGlobalChange({ branch: 'campaign', globalSlug: 'settings', req })
  expect(upsertBranchGlobalChange).toHaveBeenCalledOnce()
  await runTransactionRollbackCallbacks({ req, transactionID: 'transaction' })
  await recordBranchGlobalChange({ branch: 'campaign', globalSlug: 'settings', req })
  expect(upsertBranchGlobalChange).toHaveBeenCalledTimes(2)
  await runTransactionRollbackCallbacks({ req, transactionID: 'transaction' })
})
