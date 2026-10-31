import type { PayloadRequest } from '../types/index.js'

import { expect, test, vi } from 'vitest'

import {
  commitTransaction,
  isUnknownTransactionCommitResult,
  shouldRollbackTransactionArtifacts,
} from './commitTransaction.js'
import {
  runTransactionRollbackCallbacks,
  scheduleAfterTransactionCommit,
  scheduleAfterTransactionRollback,
} from './transactionCallbacks.js'

const commitFileOperations = vi.hoisted(() => vi.fn())
vi.mock('../uploads/fileVersioning/fileOperationManager.js', () => ({ commitFileOperations }))

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

test('should not report a cleanup failure when an adapter commits without a transaction ID', async () => {
  const loggerError = vi.fn()
  const req = {
    context: {},
    payload: {
      db: { commitTransaction: vi.fn().mockResolvedValue(undefined) },
      logger: { error: loggerError },
    },
  } as unknown as PayloadRequest

  await commitTransaction(req)

  expect(loggerError).not.toHaveBeenCalled()
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

test('should flush commit callbacks and clear rollback callbacks when file commit fails', async () => {
  const fileError = new Error('file commit failed')
  const onCommit = vi.fn()
  const onRollback = vi.fn()
  const req = {
    context: {},
    transactionID: 'file-failure',
    payload: { db: { commitTransaction: vi.fn() }, logger: { error: vi.fn() } },
  } as unknown as PayloadRequest

  commitFileOperations.mockRejectedValueOnce(fileError)
  await scheduleAfterTransactionCommit({ callback: onCommit, req })
  await scheduleAfterTransactionRollback({ callback: onRollback, req })
  await expect(commitTransaction(req)).rejects.toBe(fileError)
  await runTransactionRollbackCallbacks({ req, transactionID: 'file-failure' })

  expect(onCommit).toHaveBeenCalledOnce()
  expect(onRollback).not.toHaveBeenCalled()
  expect(req.transactionID).toBeUndefined()
})
