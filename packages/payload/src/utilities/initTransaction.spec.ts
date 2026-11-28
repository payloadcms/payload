import type { PayloadRequest } from '../types/index.js'

import { describe, expect, it, vi } from 'vitest'

import { getTransactionSnapshot, initTransaction, isTransactionActive } from './initTransaction.js'

describe('initTransaction', () => {
  it('should remove an unavailable transaction from the request', async () => {
    const req = {
      payload: {
        db: { beginTransaction: vi.fn().mockResolvedValue(null) },
      },
    } as unknown as PayloadRequest

    await expect(initTransaction(req)).resolves.toBe(false)

    expect(req).not.toHaveProperty('transactionID')
  })

  it('should remove a rejected transaction from the request', async () => {
    const transactionError = new Error('transaction unavailable')
    const req = {
      payload: {
        db: { beginTransaction: vi.fn().mockRejectedValue(transactionError) },
      },
    } as unknown as PayloadRequest

    await expect(initTransaction(req)).rejects.toBe(transactionError)

    expect(req).not.toHaveProperty('transactionID')
  })

  it('should remove an existing rejected transaction promise from the request', async () => {
    const transactionError = new Error('pending transaction unavailable')
    const transactionID = Promise.reject(transactionError)
    const req = {
      payload: { db: {} },
      transactionID,
    } as unknown as PayloadRequest

    await expect(initTransaction(req)).rejects.toBe(transactionError)

    expect(req).not.toHaveProperty('transactionID')
  })

  it('should preserve a replacement transaction while a new transaction is pending', async () => {
    let resolveTransaction!: (transactionID: string) => void
    const rollbackTransaction = vi.fn().mockResolvedValue(undefined)
    const req = {
      payload: {
        db: {
          beginTransaction: vi.fn(
            () =>
              new Promise<string>((resolve) => {
                resolveTransaction = resolve
              }),
          ),
          rollbackTransaction,
        },
      },
    } as unknown as PayloadRequest

    const initialization = initTransaction(req)

    req.transactionID = 'replacement-transaction'
    resolveTransaction('new-transaction')

    await expect(initialization).resolves.toBe(false)

    expect(req.transactionID).toBe('replacement-transaction')
    expect(rollbackTransaction).toHaveBeenCalledWith('new-transaction')
  })

  it('tracks whether a captured transaction snapshot remains active', async () => {
    const sessions: Record<string, unknown> = { 'tx-1': { db: {} } }
    const req = {
      payload: {
        db: { sessions },
      },
      transactionID: 'tx-1',
    } as unknown as PayloadRequest

    const snapshot = await getTransactionSnapshot(req)
    expect(snapshot).toEqual({ hadSession: true, transactionID: 'tx-1' })
    await expect(isTransactionActive({ ...snapshot, req })).resolves.toBe(true)

    // Direct adapter rollback removes the session even if req.transactionID was not cleared
    delete sessions['tx-1']
    await expect(isTransactionActive({ ...snapshot, req })).resolves.toBe(false)

    // Restoring session checks req.transactionID changes / deletion
    sessions['tx-1'] = { db: {} }
    delete req.transactionID
    await expect(isTransactionActive({ ...snapshot, req })).resolves.toBe(false)
  })
})
