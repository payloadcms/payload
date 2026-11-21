import { describe, expect, it } from 'vitest'

import type { DrizzleAdapter } from '../types.js'

import { getTransaction } from './getTransaction.js'
import { markWrite } from './readAfterWrite.js'

describe('getTransaction', () => {
  const createAdapter = () => {
    const defaultDrizzle = { name: 'default-drizzle' }
    const primaryDrizzle = { name: 'primary-drizzle' }
    const txDrizzle = { name: 'tx-drizzle' }

    const adapter = {
      drizzle: defaultDrizzle,
      primaryDrizzle,
      readReplicasAfterWriteInterval: 5000,
      sessions: {
        'active-tx': {
          db: txDrizzle,
          reject: async () => {},
          resolve: async () => {},
        },
      },
    } as unknown as DrizzleAdapter

    return { adapter, defaultDrizzle, primaryDrizzle, txDrizzle }
  }

  it('returns adapter.drizzle when req has no transactionID', async () => {
    const { adapter, defaultDrizzle } = createAdapter()

    await expect(getTransaction(adapter)).resolves.toBe(defaultDrizzle)
    await expect(getTransaction(adapter, {})).resolves.toBe(defaultDrizzle)
  })

  it('returns adapter.primaryDrizzle after a recent write when req has no transactionID', async () => {
    const { adapter, primaryDrizzle } = createAdapter()
    markWrite(adapter)

    await expect(getTransaction(adapter, {})).resolves.toBe(primaryDrizzle)
  })

  it('returns adapter.drizzle when pending transactionID resolves to null or undefined', async () => {
    const { adapter, defaultDrizzle } = createAdapter()

    await expect(
      getTransaction(adapter, { transactionID: Promise.resolve(null as unknown as string) }),
    ).resolves.toBe(defaultDrizzle)
    await expect(
      getTransaction(adapter, { transactionID: Promise.resolve(undefined as unknown as string) }),
    ).resolves.toBe(defaultDrizzle)
  })

  it('returns the active transaction db when session exists', async () => {
    const { adapter, txDrizzle } = createAdapter()

    await expect(getTransaction(adapter, { transactionID: 'active-tx' })).resolves.toBe(txDrizzle)
    await expect(
      getTransaction(adapter, { transactionID: Promise.resolve('active-tx') }),
    ).resolves.toBe(txDrizzle)
  })

  it('throws instead of falling back to adapter.drizzle when session is missing or rolled back', async () => {
    const { adapter } = createAdapter()

    await expect(getTransaction(adapter, { transactionID: 'rolled-back-tx' })).rejects.toThrow(
      'Transaction rolled-back-tx is no longer active.',
    )
    await expect(
      getTransaction(adapter, { transactionID: Promise.resolve('rolled-back-tx') }),
    ).rejects.toThrow('Transaction rolled-back-tx is no longer active.')

    delete adapter.sessions['active-tx']

    await expect(getTransaction(adapter, { transactionID: 'active-tx' })).rejects.toThrow(
      'Transaction active-tx is no longer active.',
    )
  })
})
