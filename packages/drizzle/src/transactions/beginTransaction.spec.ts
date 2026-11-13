import { describe, expect, it, vi } from 'vitest'

import type { DrizzleAdapter } from '../types.js'

import { beginTransaction } from './beginTransaction.js'
import { commitTransaction } from './commitTransaction.js'
import { rollbackTransaction } from './rollbackTransaction.js'

describe('Drizzle transactions', () => {
  it('should reject when the database fails to commit the transaction', async () => {
    const commitError = new Error('database commit failed')
    const execute = vi.fn(async ({ statement }: { statement: string }) => {
      if (statement === 'COMMIT') {
        throw commitError
      }
    })
    const adapter = {
      drizzle: {
        transaction: vi.fn(async (callback: (transaction: unknown) => Promise<void>) => {
          await Promise.resolve()
          await execute({ statement: 'BEGIN' })

          // Model Drizzle's transaction wrapper: a failed COMMIT triggers ROLLBACK.
          try {
            await callback({})
            await execute({ statement: 'COMMIT' })
          } catch (error) {
            await execute({ statement: 'ROLLBACK' })

            throw error
          }
        }),
      },
      initializing: Promise.resolve(),
      payload: { logger: { error: vi.fn() } },
      sessions: {},
      transactionOptions: undefined,
    } as unknown as DrizzleAdapter
    const transactionID = await beginTransaction.call(adapter, undefined)

    await expect(commitTransaction.call(adapter, transactionID)).rejects.toBe(commitError)
    expect(execute.mock.calls.map(([{ statement }]) => statement)).toEqual([
      'BEGIN',
      'COMMIT',
      'ROLLBACK',
    ])
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
