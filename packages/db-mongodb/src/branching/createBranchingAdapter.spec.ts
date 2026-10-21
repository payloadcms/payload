import { describe, expect, it, vi } from 'vitest'

import type { MongooseAdapter } from '../index.js'

import { createBranchingAdapter } from './createBranchingAdapter.js'

describe('MongoDB branch capabilities', () => {
  const setup = ({
    hello = { logicalSessionTimeoutMinutes: 30, maxWireVersion: 17, setName: 'rs0' },
    isTransactionsEnabled = true,
  }: {
    hello?: Record<string, unknown>
    isTransactionsEnabled?: boolean
  } = {}) => {
    const command = vi.fn().mockResolvedValue(hello)
    const adapter = {
      connection: { db: { command }, readyState: 1 },
      sessions: {},
      transactionOptions: {},
    } as unknown as MongooseAdapter

    return {
      adapter,
      branching: createBranchingAdapter({ adapter, isTransactionsEnabled }),
      command,
    }
  }

  it('should reject a connected standalone even when transactions are configured', async () => {
    const { branching } = setup({ hello: { logicalSessionTimeoutMinutes: 30, maxWireVersion: 17 } })

    expect(await branching.capabilities({})).toMatchObject({
      atomicBatch: false,
      interactiveTransactions: false,
    })
  })

  it('should honor explicit transaction disable without probing the server', async () => {
    const { branching, command } = setup({ isTransactionsEnabled: false })

    expect((await branching.capabilities({})).interactiveTransactions).toBe(false)
    expect(command).not.toHaveBeenCalled()
  })

  it('should require runtime session support as well as a replica set', async () => {
    const { branching } = setup({ hello: { maxWireVersion: 17, setName: 'rs0' } })

    expect((await branching.capabilities({})).interactiveTransactions).toBe(false)
  })

  it('should recognize a transaction-capable sharded deployment', async () => {
    const { branching } = setup({
      hello: { logicalSessionTimeoutMinutes: 30, maxWireVersion: 17, msg: 'isdbgrid' },
    })

    expect(await branching.capabilities({})).toEqual({
      atomicBatch: false,
      interactiveTransactions: true,
    })
  })

  it('should reject a missing caller session without starting one', async () => {
    const { branching } = setup()

    expect(
      (await branching.capabilities({ req: { transactionID: 'expired' } })).interactiveTransactions,
    ).toBe(false)
  })

  it('should reject an ended caller session', async () => {
    const { adapter, branching } = setup()

    adapter.sessions.expired = { inTransaction: () => false } as never

    expect(
      (await branching.capabilities({ req: { transactionID: 'expired' } })).interactiveTransactions,
    ).toBe(false)
  })

  it('should accept the active caller session', async () => {
    const { adapter, branching } = setup()

    adapter.sessions.active = { inTransaction: () => true } as never

    expect(
      (await branching.capabilities({ req: { transactionID: 'active' } })).interactiveTransactions,
    ).toBe(true)
  })

  it('should reject capabilities when server verification fails', async () => {
    const { branching, command } = setup()

    command.mockRejectedValue(new Error('offline'))

    expect((await branching.capabilities({})).interactiveTransactions).toBe(false)
  })
  it('should reuse verified runtime support while checking every caller session', async () => {
    const { adapter, branching, command } = setup()

    adapter.sessions.active = { inTransaction: () => true } as never
    expect(
      (await branching.capabilities({ req: { transactionID: 'active' } })).interactiveTransactions,
    ).toBe(true)
    expect(
      (await branching.capabilities({ req: { transactionID: 'expired' } })).interactiveTransactions,
    ).toBe(false)
    expect(command).toHaveBeenCalledTimes(1)
  })

  it('should reverify after the live database handle changes', async () => {
    const { adapter, branching, command } = setup()

    await branching.capabilities({})
    adapter.connection.db = { command } as never
    await branching.capabilities({})
    expect(command).toHaveBeenCalledTimes(2)
  })
})
