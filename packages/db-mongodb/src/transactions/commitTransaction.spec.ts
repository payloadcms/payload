import { describe, expect, it, vi } from 'vitest'

import type { MongooseAdapter } from '../index.js'

import { commitTransaction } from './commitTransaction.js'
import { rollbackTransaction } from './rollbackTransaction.js'

describe('commitTransaction', () => {
  it('should retry an unknown commit result on the same session until it succeeds', async () => {
    const commitError = {
      hasErrorLabel: (label: string) => label === 'UnknownTransactionCommitResult',
    }
    const session = {
      commitTransaction: vi
        .fn()
        .mockRejectedValueOnce(commitError)
        .mockResolvedValueOnce(undefined),
      endSession: vi.fn().mockResolvedValue(undefined),
      inTransaction: vi.fn().mockReturnValue(true),
    }
    const adapter = {
      sessions: { transaction: session },
    } as unknown as MongooseAdapter
    const random = vi.spyOn(Math, 'random').mockReturnValue(0)

    try {
      await commitTransaction.call(adapter, 'transaction')
    } finally {
      random.mockRestore()
    }

    expect(session.commitTransaction).toHaveBeenCalledTimes(2)
    expect(session.endSession).toHaveBeenCalledOnce()
    expect(adapter.sessions.transaction).toBeUndefined()
  })

  it('should end and remove a session when unknown commit retries reach their deadline', async () => {
    const commitError = {
      errorLabels: ['UnknownTransactionCommitResult'],
    }
    let commitAttempts = 0
    let currentTime = 0
    const session = {
      commitTransaction: vi.fn().mockImplementation(() => {
        commitAttempts += 1

        if (commitAttempts === 2) {
          currentTime = 120_000
        }

        return Promise.reject(commitError)
      }),
      endSession: vi.fn().mockResolvedValue(undefined),
      inTransaction: vi.fn().mockReturnValue(true),
    }
    const adapter = {
      sessions: { transaction: session },
    } as unknown as MongooseAdapter
    const now = vi.spyOn(Date, 'now').mockImplementation(() => currentTime)
    const random = vi.spyOn(Math, 'random').mockReturnValue(0)

    try {
      await expect(commitTransaction.call(adapter, 'transaction')).rejects.toBe(commitError)
    } finally {
      now.mockRestore()
      random.mockRestore()
    }

    expect(session.commitTransaction).toHaveBeenCalledTimes(2)
    expect(session.endSession).toHaveBeenCalledOnce()
    expect(adapter.sessions.transaction).toBeUndefined()
  })

  it('should keep a failed commit session available for rollback', async () => {
    const commitError = Object.assign(new Error('commit failed'), {
      errorLabels: ['TransientTransactionError'],
    })
    const session = {
      abortTransaction: vi.fn().mockResolvedValue(undefined),
      commitTransaction: vi.fn().mockRejectedValue(commitError),
      endSession: vi.fn().mockResolvedValue(undefined),
      inTransaction: vi.fn().mockReturnValue(true),
    }
    const adapter = {
      payload: { logger: { warn: vi.fn() } },
      sessions: { transaction: session },
    } as unknown as MongooseAdapter

    await expect(commitTransaction.call(adapter, 'transaction')).rejects.toBe(commitError)

    expect(adapter.sessions.transaction).toBe(session)

    await rollbackTransaction.call(adapter, 'transaction')

    expect(session.abortTransaction).toHaveBeenCalledOnce()
    expect(session.endSession).toHaveBeenCalledOnce()
    expect(adapter.sessions.transaction).toBeUndefined()
  })

  it('should end a failed commit session even when Mongo no longer considers it in a transaction', async () => {
    const commitError = Object.assign(new Error('commit failed'), {
      errorLabels: ['TransientTransactionError'],
    })
    let isTransactionActive = true
    const session = {
      abortTransaction: vi.fn().mockResolvedValue(undefined),
      commitTransaction: vi.fn().mockImplementation(() => {
        isTransactionActive = false

        return Promise.reject(commitError)
      }),
      endSession: vi.fn().mockResolvedValue(undefined),
      inTransaction: vi.fn().mockImplementation(() => isTransactionActive),
    }
    const adapter = {
      payload: { logger: { warn: vi.fn() } },
      sessions: { transaction: session },
    } as unknown as MongooseAdapter

    await expect(commitTransaction.call(adapter, 'transaction')).rejects.toBe(commitError)
    await rollbackTransaction.call(adapter, 'transaction')

    expect(session.abortTransaction).not.toHaveBeenCalled()
    expect(session.endSession).toHaveBeenCalledOnce()
    expect(adapter.sessions.transaction).toBeUndefined()
  })

  it('should remove and end a successfully committed session', async () => {
    const session = {
      commitTransaction: vi.fn().mockResolvedValue(undefined),
      endSession: vi.fn().mockResolvedValue(undefined),
      inTransaction: vi.fn().mockReturnValue(true),
    }
    const adapter = {
      sessions: { transaction: session },
    } as unknown as MongooseAdapter

    await commitTransaction.call(adapter, 'transaction')

    expect(session.endSession).toHaveBeenCalledOnce()
    expect(adapter.sessions.transaction).toBeUndefined()
  })
})
