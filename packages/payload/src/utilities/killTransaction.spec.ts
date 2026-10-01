import type { PayloadRequest } from '../types/index.js'

import { expect, test, vi } from 'vitest'

import { killTransaction } from './killTransaction.js'

test('should clear memoized branch state when a transaction rolls back', async () => {
  const rollbackTransaction = vi.fn().mockResolvedValue(undefined)
  const req = {
    context: {
      _branchState: {
        branch: 'feature',
        deleted: new Map(),
        manifest: new Map(),
        manifestLoaded: true,
        rowIDs: new Map(),
      },
      preserved: true,
    },
    payload: { db: { rollbackTransaction } },
    transactionID: 'transaction-id',
  } as unknown as PayloadRequest

  await killTransaction(req)

  expect(rollbackTransaction).toHaveBeenCalledWith('transaction-id')
  expect(req.transactionID).toBeUndefined()
  expect(req.context?._branchState).toBeUndefined()
  expect(req.context?.preserved).toBe(true)
})
