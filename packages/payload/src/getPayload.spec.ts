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
  let initialConfig: SanitizedConfig

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

    initialConfig = createConfig()

    // Seed the cache with an initialized instance, so getPayload skips BasePayload.init
    ;(global as any)._payload.set(key, {
      devReloadCleanup: null,
      devReloadStrategy: null,
      initializedCrons: false,
      payload: { config: initialConfig, db: {} } as unknown as Payload,
      promise: null,
      reload: false,
      reloadQueued: false,
      replacedConfigs: new WeakSet(),
    })

    // Connects the strategy
    await get(initialConfig)
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

    // The module system returns the same config object until the config file changes
    const payload = await get(firstChange)

    expect(payload.config).toBe(firstChange)
  })

  it('should reload when a call brings a newer config after the reported change was used up', async () => {
    // A request imported the config before the file changed, and calls getPayload with it only
    // after the change is reported: it uses up the reported change on the config from before it
    onReload()
    expect((await get(initialConfig)).config).toBe(initialConfig)

    // The next call brings the changed config, with no change reported any more
    const changedConfig = createConfig()
    const payload = await get(changedConfig)

    expect(payload.config).toBe(changedConfig)
  })

  it('should not start a second reload while a reload is in progress', async () => {
    const changedConfig = createConfig()
    const configOfFirstCall = createDeferred<SanitizedConfig>()
    const configOfSecondCall = createDeferred<SanitizedConfig>()

    // The first call finds no reload flagged and awaits its config
    const first = get(configOfFirstCall.promise)

    // A change is reported and the second call starts the reload
    onReload()
    const second = get(configOfSecondCall.promise)
    const reloadInProgress = (global as any)._payload.get(key).reload

    // The first call gets its config while the reload is still running
    configOfFirstCall.resolve(changedConfig)
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect((global as any)._payload.get(key).reload).toBe(reloadInProgress)

    configOfSecondCall.resolve(changedConfig)

    expect((await second).config).toBe(changedConfig)
    expect((await first).config).toBe(changedConfig)
  })

  it('should compare the config after every reload that ran while the call waited', async () => {
    const flush = () => new Promise((resolve) => setTimeout(resolve, 0))
    const configOfFirstCall = createDeferred<SanitizedConfig>()
    const configOfSecondCall = createDeferred<SanitizedConfig>()
    const configOfReloadingCall = createDeferred<SanitizedConfig>()
    const secondChange = createConfig()
    const thirdChange = createConfig()

    // Two calls find no reload flagged and await their configs
    const first = get(configOfFirstCall.promise)
    const second = get(configOfSecondCall.promise)

    // A change is reported and a third call starts the reload
    onReload()
    const reloading = get(configOfReloadingCall.promise)

    // Both calls get their configs while the reload runs, the second one first
    configOfSecondCall.resolve(secondChange)
    await flush()
    configOfFirstCall.resolve(thirdChange)
    await flush()

    // Another change is reported before the reload ends, so the second call starts the next one
    onReload()
    configOfReloadingCall.resolve(secondChange)
    await reloading
    await second

    // The first call waited for both reloads and still brings a newer config
    expect((await first).config).toBe(thirdChange)
  })

  it('should not reload back to a config that a reload replaced', async () => {
    const changedConfig = createConfig()

    onReload()
    expect((await get(changedConfig)).config).toBe(changedConfig)

    // A request that imported the config before the change calls getPayload only now
    const payload = await get(initialConfig)

    expect(payload.config).toBe(changedConfig)
  })

  it('should keep a reported change for a newer config when a call brings a replaced one', async () => {
    const firstChange = createConfig()

    onReload()
    expect((await get(firstChange)).config).toBe(firstChange)

    // The file changes again, but the next call still brings the config from before the first change
    onReload()
    expect((await get(initialConfig)).config).toBe(firstChange)

    const secondChange = createConfig()
    const payload = await get(secondChange)

    expect(payload.config).toBe(secondChange)
  })

  it('should not reload when a call brings the config the instance runs with', async () => {
    const payload = await get(initialConfig)

    expect(payload.config).toBe(initialConfig)
  })
})
