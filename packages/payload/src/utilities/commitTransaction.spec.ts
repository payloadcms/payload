import type { PayloadRequest } from '../types/index.js'

import { expect, test, vi } from 'vitest'

import {
  commitTransaction,
  isUnknownTransactionCommitResult,
  shouldRollbackTransactionArtifacts,
} from './commitTransaction.js'
import { scheduleAfterTransactionCommit } from './transactionCallbacks.js'

test.each([
  {
    error: {
      hasErrorLabel: (label: string) => label === 'UnknownTransactionCommitResult',
    },
  },
  { error: { errorLabels: ['UnknownTransactionCommitResult'] } },
])('should classify an unknown transaction commit result', ({ error }) => {
  expect(isUnknownTransactionCommitResult(error)).toBe(true)
  expect(shouldRollbackTransactionArtifacts({ error })).toBe(false)
})

test('should allow artifact rollback after a known transaction failure', () => {
  expect(shouldRollbackTransactionArtifacts({ error: new Error('commit failed') })).toBe(true)
})

test('should clear transaction callbacks without running them when the commit result remains unknown', async () => {
  const commitError = {
    errorLabels: ['UnknownTransactionCommitResult'],
  }
  const callback = vi.fn().mockResolvedValue(undefined)
  const database = {
    commitTransaction: vi.fn().mockRejectedValueOnce(commitError).mockResolvedValueOnce(undefined),
  }
  const payload = {
    db: database,
    logger: { error: vi.fn() },
  }
  const req = {
    context: {},
    payload,
    transactionID: 'indeterminate-transaction',
  } as unknown as PayloadRequest

  await scheduleAfterTransactionCommit({ callback, req })
  await expect(commitTransaction(req)).rejects.toBe(commitError)

  expect(req.transactionID).toBeUndefined()
  expect(callback).not.toHaveBeenCalled()

  const laterReq = {
    context: {},
    payload,
    transactionID: 'indeterminate-transaction',
  } as unknown as PayloadRequest

  await commitTransaction(laterReq)

  expect(callback).not.toHaveBeenCalled()
})
