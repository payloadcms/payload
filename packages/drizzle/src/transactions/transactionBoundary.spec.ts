import { describe, expect, it, vi } from 'vitest'

import type { DrizzleAdapter } from '../types.js'

import { beginTransaction } from './beginTransaction.js'
import { commitTransaction } from './commitTransaction.js'
import { rollbackTransaction } from './rollbackTransaction.js'

describe('Caller-owned native transaction outcomes', () => {
  it('should not commit until the caller commits the registered session', async () => {
    const { adapter, events } = setup({})
    const id = await beginTransaction.call(adapter)

    expect(events).toEqual(['begin'])
    expect(adapter.sessions[id]).toBeDefined()
    await commitTransaction.call(adapter, id)
    expect(events).toEqual(['begin', 'commit'])
    expect(adapter.sessions[id]).toBeUndefined()
  })

  it('should intentionally roll back without treating the rollback signal as a native failure', async () => {
    const { adapter, events } = setup({})
    const id = await beginTransaction.call(adapter)

    await rollbackTransaction.call(adapter, id)
    expect(events).toEqual(['begin', 'rollback'])
    expect(adapter.sessions[id]).toBeUndefined()
  })

  it('should propagate a native commit failure instead of acknowledging success', async () => {
    const error = new Error('Native commit failed')
    const { adapter, events } = setup({ commitError: error })
    const id = await beginTransaction.call(adapter)

    await expect(commitTransaction.call(adapter, id)).rejects.toBe(error)
    expect(events).toEqual(['begin', 'commit', 'rollback'])
    expect(adapter.sessions[id]).toBeUndefined()
  })

  it('should propagate a native rollback failure after clearing the session', async () => {
    const error = new Error('Native rollback failed')
    const { adapter } = setup({ rollbackError: error })
    const id = await beginTransaction.call(adapter)

    await expect(rollbackTransaction.call(adapter, id)).rejects.toBe(error)
    expect(adapter.sessions[id]).toBeUndefined()
  })

  it('should preserve the original commit failure if cleanup also fails', async () => {
    const commitError = new Error('Commit acknowledgement failed')
    const adapter = {
      sessions: {
        test: {
          resolve: vi.fn().mockRejectedValue(commitError),
          reject: vi.fn().mockRejectedValue(new Error('Cleanup failed')),
        },
      },
    } as unknown as DrizzleAdapter

    await expect(commitTransaction.call(adapter, 'test')).rejects.toBe(commitError)
    expect(adapter.sessions.test).toBeUndefined()
  })

  it('should reject a native begin failure without registering a session', async () => {
    const { adapter } = setup({ beginError: new Error('Native begin failed') })

    await expect(beginTransaction.call(adapter)).rejects.toThrow('Native begin failed')
    expect(adapter.sessions).toEqual({})
  })

  it('should permit a later transaction after an earlier commit failed', async () => {
    const { adapter, events } = setup({ commitError: new Error('First commit failed') })
    const id = await beginTransaction.call(adapter)

    await expect(commitTransaction.call(adapter, id)).rejects.toThrow('First commit failed')
    const next = setup({})

    adapter.drizzle = next.adapter.drizzle
    const nextID = await beginTransaction.call(adapter)

    await commitTransaction.call(adapter, nextID)
    expect(adapter.sessions).toEqual({})
    expect(events).toEqual(['begin', 'commit', 'rollback'])
    expect(next.events).toEqual(['begin', 'commit'])
  })
})

const setup = ({
  beginError,
  commitError,
  rollbackError,
}: {
  beginError?: Error
  commitError?: Error
  rollbackError?: Error
}) => {
  const events: string[] = []
  const adapter = {
    initializing: Promise.resolve(),
    payload: { logger: { error: vi.fn() } },
    sessions: {},
    drizzle: {
      transaction: async (callback: (tx: unknown) => Promise<void>) => {
        events.push('begin')
        if (beginError) {
          throw beginError
        }

        try {
          await callback({})
          events.push('commit')
          if (commitError) {
            throw commitError
          }
        } catch (error) {
          events.push('rollback')
          if (rollbackError) {
            throw rollbackError
          }

          throw error
        }
      },
    },
  } as unknown as DrizzleAdapter

  return { adapter, events }
}
