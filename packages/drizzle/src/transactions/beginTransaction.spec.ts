import { describe, expect, it, vi } from 'vitest'

import type { DrizzleAdapter } from '../types.js'

import { beginTransaction } from './beginTransaction.js'
import { commitTransaction } from './commitTransaction.js'
import { rollbackTransaction } from './rollbackTransaction.js'

describe('Drizzle transactions', () => {
  it('should reject when the database fails to commit the transaction', async () => {
    const commitError = new Error('database commit failed')
    const adapter = {
      drizzle: {
        transaction: vi.fn(async (callback: (transaction: unknown) => Promise<void>) => {
          await Promise.resolve()
          await callback({})

          throw commitError
        }),
      },
      initializing: Promise.resolve(),
      payload: { logger: { error: vi.fn() } },
      sessions: {},
      transactionOptions: undefined,
    } as unknown as DrizzleAdapter
    const transactionID = await beginTransaction.call(adapter, undefined)

    await expect(commitTransaction.call(adapter, transactionID)).rejects.toBe(commitError)
    expect(adapter.sessions[transactionID]).toBeUndefined()
  })

  it('should resolve when rollback deliberately rejects the transaction callback', async () => {
    const adapter = {
      drizzle: {
        transaction: vi.fn(async (callback: (transaction: unknown) => Promise<void>) => {
          await Promise.resolve()
          await callback({})
        }),
      },
      initializing: Promise.resolve(),
      payload: { logger: { error: vi.fn() } },
      sessions: {},
      transactionOptions: undefined,
    } as unknown as DrizzleAdapter
    const transactionID = await beginTransaction.call(adapter, undefined)

    await expect(rollbackTransaction.call(adapter, transactionID)).resolves.toBeUndefined()
    expect(adapter.sessions[transactionID]).toBeUndefined()
  })

  it('should reject when the database fails to roll back the transaction', async () => {
    const rollbackError = new Error('database rollback failed')
    const adapter = {
      drizzle: {
        transaction: vi.fn(async (callback: (transaction: unknown) => Promise<void>) => {
          await Promise.resolve()

          try {
            await callback({})
          } catch {
            throw rollbackError
          }
        }),
      },
      initializing: Promise.resolve(),
      payload: { logger: { error: vi.fn() } },
      sessions: {},
      transactionOptions: undefined,
    } as unknown as DrizzleAdapter
    const transactionID = await beginTransaction.call(adapter, undefined)

    await expect(rollbackTransaction.call(adapter, transactionID)).rejects.toBe(rollbackError)
    expect(adapter.sessions[transactionID]).toBeUndefined()
  })
})
