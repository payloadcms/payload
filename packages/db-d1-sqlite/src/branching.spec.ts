import type { Payload } from 'payload'

import { describe, expect, it, vi } from 'vitest'

import { sqliteD1Adapter } from './index.js'

// D1's transaction method exists on Drizzle but throws: batch support cannot imply
// support for Payload's interactive, multi-operation branch transaction protocol.
describe('D1 branch capabilities', () => {
  it('should reject atomic batches when the configured binding has no native batch method', async () => {
    const prepare = vi.fn()
    const adapter = sqliteD1Adapter({ binding: { prepare } as never }).init({
      payload: {} as Payload,
    })

    await expect(
      adapter.branching.executeAtomicBatch({ statements: [{ sql: 'SELECT 1' }] }),
    ).rejects.toThrow('require a D1 binding with batch support')
    expect(prepare).not.toHaveBeenCalled()
  })

  it('should sanitize preparation failures without submitting an incomplete batch', async () => {
    const batch = vi.fn()
    const prepare = vi.fn(() => {
      throw new Error('native SQL containing private values')
    })
    const adapter = sqliteD1Adapter({ binding: { batch, prepare } as never }).init({
      payload: {} as Payload,
    })

    await expect(
      adapter.branching.executeAtomicBatch({ statements: [{ sql: 'SELECT 1' }] }),
    ).rejects.toThrow(/^D1 branch atomic batch failed\.$/)
    expect(batch).not.toHaveBeenCalled()
  })

  it('should use the connected D1 session for native batches', async () => {
    const originalBatch = vi.fn()
    const batch = vi.fn().mockResolvedValue([{ meta: { changes: 0 }, results: [{ value: 1 }] }])
    const bind = vi.fn().mockReturnValue({})
    const prepare = vi.fn().mockReturnValue({ bind })
    const adapter = sqliteD1Adapter({ binding: { batch: originalBatch } as never }).init({
      payload: {} as Payload,
    })

    adapter.client = { batch, prepare } as never

    await expect(
      adapter.branching.executeAtomicBatch({ statements: [{ sql: 'SELECT 1' }] }),
    ).resolves.toEqual([{ changes: 0, rows: [{ value: 1 }] }])
    expect(batch).toHaveBeenCalledOnce()
    expect(originalBatch).not.toHaveBeenCalled()
  })

  it('should reject interactive branch mutations even when transactionOptions is configured', async () => {
    const adapter = sqliteD1Adapter({
      binding: {} as never,
      transactionOptions: { behavior: 'immediate' },
    }).init({ payload: {} as Payload })
    const transaction = vi.fn()

    adapter.drizzle = { transaction } as never

    await expect(adapter.branching.capabilities({})).resolves.toEqual({
      atomicBatch: false,
      interactiveTransactions: false,
      reason: expect.stringContaining('D1'),
    })
    await expect(
      adapter.branching.mutateVersion({
        entity: { slug: 'posts', parentID: 1, type: 'collection' },
        expected: { id: 1, generation: 0 },
        mutation: { type: 'initialize', isFrozen: true, ownerKey: 'head' },
        req: { transactionID: 'fake-session' } as never,
      }),
    ).rejects.toThrow('D1')
    expect(transaction).not.toHaveBeenCalled()
  })
})
