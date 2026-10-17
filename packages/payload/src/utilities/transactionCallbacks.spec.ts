import { expect, it, vi } from 'vitest'

import type { PayloadRequest } from '../types/index.js'

import { commitTransaction } from './commitTransaction.js'
import {
  beginDeferredCleanupScope,
  clearDeferredCleanupScope,
  flushDeferredCleanupScope,
  scheduleAfterTransactionCommit,
} from './transactionCallbacks.js'

it('should preserve callback registration order across transaction scopes', async () => {
  const callbackOrder: string[] = []
  const database = { commitTransaction: vi.fn().mockResolvedValue(undefined) }
  const req = {
    context: {},
    payload: { db: database, logger: { error: vi.fn() } },
    transactionID: 'transaction',
  } as unknown as PayloadRequest
  const parentScope = await beginDeferredCleanupScope({ req })

  await scheduleAfterTransactionCommit({
    callback: async () => {
      callbackOrder.push('parent before child')
    },
    req,
  })

  const childScope = await beginDeferredCleanupScope({ req })

  await scheduleAfterTransactionCommit({
    callback: async () => {
      callbackOrder.push('child')
    },
    req,
  })
  await flushDeferredCleanupScope({ req, scope: childScope })

  await scheduleAfterTransactionCommit({
    callback: async () => {
      callbackOrder.push('parent after child')
    },
    req,
  })
  await flushDeferredCleanupScope({ req, scope: parentScope })
  await commitTransaction(req)

  expect(callbackOrder).toEqual(['parent before child', 'child', 'parent after child'])
})

it('should discard a flushed child scope when its parent transaction scope is cleared', async () => {
  const callbackOrder: string[] = []
  const database = { commitTransaction: vi.fn().mockResolvedValue(undefined) }
  const req = {
    context: {},
    payload: { db: database, logger: { error: vi.fn() } },
    transactionID: 'transaction',
  } as unknown as PayloadRequest
  const parentScope = await beginDeferredCleanupScope({ req })
  const childScope = await beginDeferredCleanupScope({ req })

  await scheduleAfterTransactionCommit({
    callback: async () => {
      callbackOrder.push('child')
    },
    req,
  })
  await flushDeferredCleanupScope({ req, scope: childScope })
  clearDeferredCleanupScope({ req, scope: parentScope })
  await commitTransaction(req)

  expect(callbackOrder).toEqual([])
})
