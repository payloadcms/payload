import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { DevReloadStrategy } from './admin/adapters/devReload.js'
import type { SanitizedConfig } from './config/types.js'

import { getPayload, type Payload } from './index.js'

/**
 * A config that `reload()` can apply without touching a database, generating types
 * or writing an import map.
 */
const createConfig = (): SanitizedConfig =>
  ({
    admin: { importMap: { autoGenerate: false } },
    blocks: [],
    collections: [],
    globals: [],
    typescript: { autoGenerate: false },
  }) as unknown as SanitizedConfig

const createDeferred = <T>() => {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => (resolve = res))
  return { promise, resolve }
}

describe('getPayload dev reload', () => {
  const key = 'getPayload-dev-reload-spec'

  let onReload: () => void
  let strategy: DevReloadStrategy

  const get = (config: Promise<SanitizedConfig> | SanitizedConfig) =>
    getPayload({ config, devReloadStrategy: strategy, disableDBConnect: true, key })

  beforeEach(async () => {
    // connectDevReload is a no-op under NODE_ENV=test
    vi.stubEnv('NODE_ENV', 'development')

    strategy = {
      connect: (callback) => {
        onReload = callback
        return () => {}
      },
    }

    // Seed the cache with an initialized instance, so getPayload skips BasePayload.init
    ;(global as any)._payload.set(key, {
      devReloadCleanup: null,
      devReloadStrategy: null,
      initializedCrons: false,
      payload: { config: createConfig(), db: {} } as unknown as Payload,
      promise: null,
      reload: false,
      reloadQueued: false,
    })

    // Connects the strategy
    await get(createConfig())
  })

  afterEach(() => {
    ;(global as any)._payload.delete(key)
    vi.unstubAllEnvs()
  })

  it('should reload the config when a change is reported', async () => {
    const changedConfig = createConfig()

    onReload()

    const payload = await get(changedConfig)

    expect(payload.config).toBe(changedConfig)
  })

  it('should reload again when a change is reported while a reload is in progress', async () => {
    const pendingConfig = createDeferred<SanitizedConfig>()

    onReload()
    const reloading = get(pendingConfig.promise)

    // A second file is saved while the first reload is still running
    onReload()

    const firstChange = createConfig()
    pendingConfig.resolve(firstChange)
    expect((await reloading).config).toBe(firstChange)

    const secondChange = createConfig()
    const payload = await get(secondChange)

    expect(payload.config).toBe(secondChange)
  })

  it('should not reload again when no change is reported during a reload', async () => {
    const pendingConfig = createDeferred<SanitizedConfig>()

    onReload()
    const reloading = get(pendingConfig.promise)

    const firstChange = createConfig()
    pendingConfig.resolve(firstChange)
    await reloading

    const payload = await get(createConfig())

    expect(payload.config).toBe(firstChange)
  })
})
