import type { Config, InitOptions } from './config/types.js'
import type { BaseDatabaseAdapter } from './database/types.js'

import { randomUUID } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { buildConfig } from './config/build.js'
import { getPayload } from './index.js'

describe('getPayload initialization', () => {
  const cacheKeys = new Set<string>()

  beforeEach(() => {
    vi.stubEnv('PAYLOAD_DISABLE_DEPENDENCY_CHECKER', 'true')
  })

  afterEach(() => {
    const cache = (global as typeof global & { _payload: Map<string, unknown> })._payload

    for (const key of cacheKeys) {
      cache.delete(key)
    }

    cacheKeys.clear()
    vi.unstubAllEnvs()
  })

  const createOptions = async () => {
    const key = randomUUID()
    const connect = vi
      .fn<NonNullable<BaseDatabaseAdapter['connect']>>()
      .mockResolvedValue(undefined)
    const onInit = vi.fn<NonNullable<Config['onInit']>>()
    const dbInit = vi
      .fn()
      .mockImplementation(() => ({ connect, name: 'test' }) as BaseDatabaseAdapter)

    cacheKeys.add(key)

    const options: InitOptions & { key: string } = {
      config: await buildConfig({
        admin: { disable: true, importMap: { autoGenerate: false } },
        collections: [],
        db: { defaultIDType: 'text', init: dbInit },
        logger: { options: { level: 'silent' } },
        onInit,
        secret: 'test-secret',
        telemetry: false,
        typescript: { autoGenerate: false },
      }),
      key,
    }

    return { connect, dbInit, onInit, options }
  }

  it('should run onInit after retrying a failed database connection', async () => {
    const { connect, onInit, options } = await createOptions()
    const initError = new Error('Database unavailable')
    const optionsOnInit = vi.fn<NonNullable<InitOptions['onInit']>>()

    options.onInit = optionsOnInit
    connect.mockRejectedValueOnce(initError)

    await expect(getPayload(options)).rejects.toBe(initError)
    expect(initError).toHaveProperty('payloadInitError', true)
    expect(onInit).not.toHaveBeenCalled()
    expect(optionsOnInit).not.toHaveBeenCalled()

    const payload = await getPayload(options)

    expect(onInit).toHaveBeenCalledExactlyOnceWith(payload)
    expect(optionsOnInit).toHaveBeenCalledExactlyOnceWith(payload)
    expect(await getPayload(options)).toBe(payload)
    expect(connect).toHaveBeenCalledTimes(2)
    expect(onInit).toHaveBeenCalledTimes(1)
    expect(optionsOnInit).toHaveBeenCalledTimes(1)
  })

  it('should run onInit for concurrent callers sharing an options object', async () => {
    const { dbInit, onInit, options } = await createOptions()
    const [firstPayload, secondPayload] = await Promise.all([
      getPayload(options),
      getPayload(options),
    ])

    expect(firstPayload).toBe(secondPayload)
    expect(dbInit).toHaveBeenCalledTimes(1)
    expect(onInit).toHaveBeenCalledExactlyOnceWith(firstPayload)
    expect(await getPayload(options)).toBe(firstPayload)
    expect(onInit).toHaveBeenCalledTimes(1)
    expect(options).not.toHaveProperty('disableOnInit')
  })

  it('should respect explicit disableOnInit when retrying initialization', async () => {
    const { connect, onInit, options } = await createOptions()
    const optionsOnInit = vi.fn<NonNullable<InitOptions['onInit']>>()

    options.disableOnInit = true
    options.onInit = optionsOnInit
    connect.mockRejectedValueOnce(new Error('Database unavailable'))

    await expect(getPayload(options)).rejects.toThrow('Database unavailable')
    await getPayload(options)

    expect(connect).toHaveBeenCalledTimes(2)
    expect(onInit).not.toHaveBeenCalled()
    expect(optionsOnInit).not.toHaveBeenCalled()
    expect(options.disableOnInit).toBe(true)
  })
})
