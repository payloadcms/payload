import type { Payload } from 'payload'

import { afterEach, describe, expect, it, vi } from 'vitest'

import type { Args } from './types.js'

import { postgresAdapter } from './index.js'

describe('connect', () => {
  const onUnhandledRejection = vi.fn()

  afterEach(() => {
    process.off('unhandledRejection', onUnhandledRejection)
    onUnhandledRejection.mockReset()
  })

  it('rejects initializing with the connect error and leaves no unhandled rejection', async () => {
    const connectError = new Error('connect ECONNREFUSED 127.0.0.1:5432')
    class Pool {
      connect() {
        return Promise.reject(connectError)
      }
    }
    const payload = { logger: { error: vi.fn(), info: vi.fn() } } as unknown as Payload
    const adapter = postgresAdapter({ pg: { Pool } as unknown as Args['pg'], pool: {} }).init({
      payload,
    })
    process.on('unhandledRejection', onUnhandledRejection)

    await expect(adapter.connect!()).rejects.toThrow('cannot connect to Postgres')
    // Nothing awaits `initializing` here, as on a request path that opens no transaction.
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(onUnhandledRejection).not.toHaveBeenCalled()
    await expect(adapter.initializing).rejects.toBe(connectError)
  })
})
