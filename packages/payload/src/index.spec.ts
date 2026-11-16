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

  const createOptions = async ({ config = {} }: { config?: Partial<Config> } = {}) => {
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
        ...config,
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

  it('should run onInit after retrying with the default cache key', async () => {
    const { connect, onInit, options } = await createOptions()
    const cache = (global as typeof global & { _payload: Map<string, unknown> })._payload
    const previousEntry = cache.get('default')
    const defaultOptions = { ...options, key: undefined }

    cache.delete('default')
    connect.mockRejectedValueOnce(new Error('Database unavailable'))

    try {
      await expect(getPayload(defaultOptions)).rejects.toThrow('Database unavailable')

      const payload = await getPayload(defaultOptions)

      expect(onInit).toHaveBeenCalledExactlyOnceWith(payload)
      expect(await getPayload(defaultOptions)).toBe(payload)
    } finally {
      cache.delete('default')

      if (previousEntry) {
        cache.set('default', previousEntry)
      }
    }
  })

  it('should share failed and successful initialization attempts between concurrent callers', async () => {
    const { connect, dbInit, onInit, options } = await createOptions()
    const initError = new Error('Database unavailable')
    let rejectConnection!: (reason: Error) => void

    connect.mockImplementationOnce(
      () => new Promise<void>((_resolve, reject) => (rejectConnection = reject)),
    )

    const firstAttempt = getPayload(options)
    const secondAttempt = getPayload(options)
    const failures = Promise.allSettled([firstAttempt, secondAttempt])

    await vi.waitFor(() => expect(connect).toHaveBeenCalledTimes(1))
    rejectConnection(initError)

    expect(await failures).toEqual([
      { reason: initError, status: 'rejected' },
      { reason: initError, status: 'rejected' },
    ])

    const [firstPayload, secondPayload] = await Promise.all([
      getPayload(options),
      getPayload(options),
    ])

    expect(firstPayload).toBe(secondPayload)
    expect(dbInit).toHaveBeenCalledTimes(2)
    expect(connect).toHaveBeenCalledTimes(2)
    expect(onInit).toHaveBeenCalledExactlyOnceWith(firstPayload)
    expect(await getPayload(options)).toBe(firstPayload)
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
    expect(options).not.toHaveProperty('disableOnInit')
  })

  it('should not mutate options when returning a cached instance', async () => {
    const { onInit, options } = await createOptions()
    const payload = await getPayload(options)

    expect(await getPayload(options)).toBe(payload)
    expect(options).not.toHaveProperty('disableOnInit')
    expect(onInit).toHaveBeenCalledTimes(1)
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

  it('should keep other cache keys initialized when one initialization fails', async () => {
    const first = await createOptions()
    const second = await createOptions()
    const firstPayload = await getPayload(first.options)

    second.connect.mockRejectedValueOnce(new Error('Database unavailable'))

    await expect(getPayload(second.options)).rejects.toThrow('Database unavailable')

    const secondPayload = await getPayload(second.options)

    expect(secondPayload).not.toBe(firstPayload)
    expect(await getPayload(first.options)).toBe(firstPayload)
    expect(first.onInit).toHaveBeenCalledTimes(1)
    expect(first.connect).toHaveBeenCalledTimes(1)
    expect(second.onInit).toHaveBeenCalledExactlyOnceWith(secondPayload)
  })

  it('should not rerun onInit during a development reload', async () => {
    const { connect, onInit, options } = await createOptions()
    const payload = await getPayload(options)
    const cache = (global as typeof global & { _payload: Map<string, { reload: boolean }> })
      ._payload

    cache.get(options.key)!.reload = true

    expect(await getPayload(options)).toBe(payload)
    expect(connect).toHaveBeenLastCalledWith({ hotReload: true })
    expect(onInit).toHaveBeenCalledTimes(1)
  })
})
