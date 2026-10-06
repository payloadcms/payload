import type { InitOptions, SanitizedConfig } from './config/types.js'

import { afterEach, describe, expect, it, vi } from 'vitest'

import { BasePayload, getPayload } from './index.js'

const key = 'test-pending-dev-reload'
const globalKeys = [
  '_payload_clientConfigs',
  '_payload_schemaMap',
  '_payload_clientSchemaMap',
  '_payload_doNotCacheClientConfig',
  '_payload_doNotCacheSchemaMap',
  '_payload_doNotCacheClientSchemaMap',
] as const
const originalGlobals = globalKeys.map((key) => ({
  key,
  hasValue: Object.hasOwn(globalThis, key),
  value: Reflect.get(globalThis, key),
}))

const createConfig = ({ marker }: { marker: string }) =>
  ({
    admin: { importMap: { autoGenerate: false } },
    blocks: [],
    collections: [],
    custom: { marker },
    globals: [],
    typescript: { autoGenerate: false },
  }) as SanitizedConfig

afterEach(() => {
  const cache = Reflect.get(globalThis, '_payload') as Map<
    string,
    { devReloadCleanup?: () => void }
  >

  cache.get(key)?.devReloadCleanup?.()
  cache.delete(key)
  for (const { key, hasValue, value } of originalGlobals) {
    if (hasValue) {
      Reflect.set(globalThis, key, value)
    } else {
      Reflect.deleteProperty(globalThis, key)
    }
  }
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

describe('getPayload dev reload', () => {
  it('should apply an invalidation received during an in-flight reload on the next request', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    let notifyReload!: () => void
    let finishDestroy!: () => void
    const destroy = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finishDestroy = resolve
        }),
    )
    const devReloadStrategy = {
      connect: (notify: () => void) => {
        notifyReload = notify
        return vi.fn()
      },
    }

    vi.spyOn(BasePayload.prototype, 'init').mockImplementation(async function (
      options: InitOptions,
    ) {
      this.config = await options.config
      this.db = { destroy } as BasePayload['db']
      return this
    })

    await getPayload({ config: createConfig({ marker: 'initial' }), devReloadStrategy, key })
    notifyReload()
    const firstReload = getPayload({
      config: createConfig({ marker: 'first' }),
      devReloadStrategy,
      key,
    })

    await vi.waitFor(() => expect(destroy).toHaveBeenCalledOnce())
    notifyReload()
    finishDestroy()
    await firstReload
    destroy.mockResolvedValueOnce(undefined)

    const payload = await getPayload({
      config: createConfig({ marker: 'second' }),
      devReloadStrategy,
      key,
    })

    expect(payload.config.custom.marker).toBe('second')
    expect(destroy).toHaveBeenCalledTimes(2)
  })
})
