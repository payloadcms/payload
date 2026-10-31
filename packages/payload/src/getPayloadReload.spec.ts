import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { SanitizedConfig } from './config/types.js'

import type { Payload } from './index.js'

import { getPayload } from './index.js'

const createConfig = (): SanitizedConfig =>
  ({
    admin: { importMap: { autoGenerate: false } },
    blocks: [],
    collections: [],
    globals: [],
    typescript: { autoGenerate: false },
  }) as unknown as SanitizedConfig

const createCachedPayload = () => ({
  initializedCrons: true,
  payload: {
    config: createConfig(),
    db: {
      connect: vi.fn().mockResolvedValue(undefined),
      destroy: vi.fn().mockResolvedValue(undefined),
    },
  } as unknown as Payload,
  promise: null,
  reload: true as boolean | Promise<void>,
  ws: null,
})

describe('getPayload failed dev reload', () => {
  const key = 'getPayload-failed-dev-reload-spec'
  const cache = (global as typeof global & { _payload: Map<string, unknown> })._payload
  let cached: ReturnType<typeof createCachedPayload>

  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'test')
    cached = createCachedPayload()
    cache.set(key, cached)
  })

  afterEach(() => {
    cache.delete(key)
    vi.unstubAllEnvs()
  })

  it.each(['config', 'connect'] as const)(
    'should reject concurrent callers with the original %s failure',
    async (stage) => {
      const failure = new Error('Controlled reload failure')
      const config = stage === 'config' ? Promise.reject(failure) : createConfig()

      if (stage === 'connect') {
        vi.mocked(cached.payload.db.connect).mockRejectedValueOnce(failure)
      }

      const first = getPayload({ config, key })
      const second = getPayload({ config, key })
      await Promise.all([expect(first).rejects.toBe(failure), expect(second).rejects.toBe(failure)])
      expect(cached.reload).toBe(true)
    },
  )

  it.each(['config', 'connect'] as const)(
    'should allow the next caller to retry after a %s failure',
    async (stage) => {
      const failure = new Error('Controlled reload failure')
      const config = stage === 'config' ? Promise.reject(failure) : createConfig()

      if (stage === 'connect') {
        vi.mocked(cached.payload.db.connect).mockRejectedValueOnce(failure)
      }

      await expect(getPayload({ config, key })).rejects.toBe(failure)

      const nextConfig = createConfig()

      await expect(getPayload({ config: nextConfig, key })).resolves.toBe(cached.payload)
      expect(cached.payload.config).toBe(nextConfig)
      expect(cached.reload).toBe(false)
    },
  )

  it('should keep retrying after consecutive reload failures', async () => {
    const firstFailure = new Error('First reconnect failure')
    const secondFailure = new Error('Second reconnect failure')

    vi.mocked(cached.payload.db.connect)
      .mockRejectedValueOnce(firstFailure)
      .mockRejectedValueOnce(secondFailure)

    await expect(getPayload({ config: createConfig(), key })).rejects.toBe(firstFailure)
    await expect(getPayload({ config: createConfig(), key })).rejects.toBe(secondFailure)
    await expect(getPayload({ config: createConfig(), key })).resolves.toBe(cached.payload)
    expect(cached.reload).toBe(false)
  })

  it('should still share one successful reload between concurrent callers', async () => {
    const config = createConfig()
    const results = await Promise.all([
      getPayload({ config, key }),
      getPayload({ config, key }),
      getPayload({ config, key }),
    ])

    expect(results).toEqual([cached.payload, cached.payload, cached.payload])
    expect(cached.payload.db.destroy).toHaveBeenCalledTimes(1)
    expect(cached.payload.db.connect).toHaveBeenCalledTimes(1)
    expect(cached.reload).toBe(false)
  })
})
