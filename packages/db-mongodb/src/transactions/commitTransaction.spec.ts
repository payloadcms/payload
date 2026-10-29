import { afterEach, describe, expect, it, vi } from 'vitest'

import type { MongooseAdapter } from '../index.js'

import { commitTransaction } from './commitTransaction.js'
import { rollbackTransaction } from './rollbackTransaction.js'

describe('commitTransaction', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it.each([
    { configuredTimeout: undefined, expectedTimeout: 120_000 },
    { configuredTimeout: 0, expectedTimeout: 120_000 },
    { configuredTimeout: 5_000, expectedTimeout: 5_000 },
    { configuredTimeout: 240_000, expectedTimeout: 120_000 },
  ])(
    'should bound a commit with configured timeout $configuredTimeout to $expectedTimeout ms',
    async ({ configuredTimeout, expectedTimeout }) => {
      vi.useFakeTimers()
      vi.setSystemTime(0)

      const session = {
        commitTransaction: vi.fn().mockResolvedValue(undefined),
        endSession: vi.fn().mockResolvedValue(undefined),
        inTransaction: vi.fn().mockReturnValue(true),
        timeoutMS: configuredTimeout,
      }
      const adapter = {
        sessions: { transaction: session },
      } as unknown as MongooseAdapter

      await commitTransaction.call(adapter, 'transaction')

      expect(session.commitTransaction).toHaveBeenCalledWith({ timeoutMS: expectedTimeout })
    },
  )

  it('should time out a stalled retry within the remaining commit budget', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(0)
    vi.spyOn(Math, 'random').mockReturnValue(0)

    const commitError = { errorLabels: ['UnknownTransactionCommitResult'] }
    const timeoutError = new Error('commit timed out')
    const session = {
      commitTransaction: vi
        .fn()
        .mockImplementationOnce(() => {
          vi.setSystemTime(119_000)

          return Promise.reject(commitError)
        })
        .mockImplementation(
          ({ timeoutMS = 240_000 }: { timeoutMS?: number } = {}) =>
            new Promise((_, reject) => setTimeout(() => reject(timeoutError), timeoutMS)),
        ),
      endSession: vi.fn().mockResolvedValue(undefined),
      inTransaction: vi.fn().mockReturnValue(false),
    }
    const adapter = {
      payload: { logger: { warn: vi.fn() } },
      sessions: { transaction: session },
    } as unknown as MongooseAdapter

    session.inTransaction.mockReturnValueOnce(true)

    const commit = commitTransaction.call(adapter, 'transaction')
    const rejection = expect(commit).rejects.toBe(timeoutError)

    await vi.advanceTimersByTimeAsync(1_000)
    await rejection

    expect(session.commitTransaction).toHaveBeenNthCalledWith(2, { timeoutMS: 1_000 })
    expect(adapter.sessions.transaction).toBe(session)

    await rollbackTransaction.call(adapter, 'transaction')

    expect(session.endSession).toHaveBeenCalledOnce()
    expect(adapter.sessions.transaction).toBeUndefined()
  })

  it('should stop retrying when the retry delay resumes after the deadline', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(0)
    vi.spyOn(Math, 'random').mockReturnValue(0.5)

    const commitError = { errorLabels: ['UnknownTransactionCommitResult'] }
    const session = {
      commitTransaction: vi.fn().mockRejectedValue(commitError),
      endSession: vi.fn().mockResolvedValue(undefined),
      inTransaction: vi.fn().mockReturnValue(true),
    }
    const adapter = {
      sessions: { transaction: session },
    } as unknown as MongooseAdapter
    const commit = commitTransaction.call(adapter, 'transaction')
    const rejection = expect(commit).rejects.toBe(commitError)

    await vi.advanceTimersByTimeAsync(0)
    vi.setSystemTime(120_000)
    await vi.advanceTimersByTimeAsync(5)
    await rejection

    expect(session.commitTransaction).toHaveBeenCalledOnce()
    expect(session.endSession).toHaveBeenCalledOnce()
    expect(adapter.sessions.transaction).toBeUndefined()
  })

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
