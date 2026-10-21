import type { PayloadRequest } from 'payload'

import { describe, expect, it, vi } from 'vitest'

import type { MongooseAdapter } from '../index.js'

import { createReadSnapshot } from './createReadSnapshot.js'

describe('MongoDB branch snapshot cleanup', () => {
  it('should preserve the primary callback failure through failed session cleanup without starting a transaction', async () => {
    const primary = new Error('callback')
    const abort = new Error('abort')
    const end = new Error('end')
    const session = {
      abortTransaction: vi.fn().mockRejectedValue(abort),
      commitTransaction: vi.fn().mockRejectedValue(primary),
      endSession: vi.fn().mockRejectedValue(end),
      inTransaction: () => true,
      snapshotTime: {},
      startTransaction: vi.fn(),
    }
    const adapter = {
      connection: {
        getClient: () => ({ startSession: () => session }),
        db: { collection: () => ({ findOne: async () => null }) },
      },
      sessions: {},
      payload: {
        collections: {
          anchor: { config: { custom: { branchQueryStorage: { states: 'anchor' } } } },
        },
      },
      collections: { anchor: { collection: { name: 'anchor' } } },
    } as unknown as MongooseAdapter
    const error = vi.fn()
    const req = { payload: { db: adapter, logger: { error } } } as unknown as PayloadRequest
    const read = vi.fn(async () => {
      throw primary
    })

    await expect(
      createReadSnapshot({ adapter, isTransactionsEnabled: true })({ read, req }),
    ).rejects.toBe(primary)
    expect(read).toHaveBeenCalledTimes(1)
    expect(error.mock.calls.map(([value]) => value.err)).toEqual([end])
    expect(session.startTransaction).not.toHaveBeenCalled()
    expect(session.commitTransaction).not.toHaveBeenCalled()
    expect(session.abortTransaction).not.toHaveBeenCalled()
    expect(session.endSession).toHaveBeenCalledTimes(1)
  })
})
