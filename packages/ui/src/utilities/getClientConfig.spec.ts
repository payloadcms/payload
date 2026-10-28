import type { I18nClient } from '@payloadcms/translations'
import type { ClientConfig, ImportMap, SanitizedConfig } from 'payload'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getClientConfig } from './getClientConfig.js'

// The real client config builder needs a fully sanitized config. These tests only care about
// which config the cached client config was built from, so record that instead.
vi.mock('payload', () => ({
  createClientConfig: ({ config, i18n }: { config: SanitizedConfig; i18n: I18nClient }) => ({
    builtFrom: config,
    language: i18n.language,
  }),
  createUnauthenticatedClientConfig: ({ clientConfig }: { clientConfig: ClientConfig }) => ({
    ...clientConfig,
    unauthenticated: true,
  }),
}))

const importMap: ImportMap = {}
const user = { id: 1 } as never

const createI18n = (language: 'en' | 'fr') => ({ language }) as unknown as I18nClient

const createConfig = (collectionSlugs: string[]): SanitizedConfig =>
  ({
    collections: collectionSlugs.map((slug) => ({ slug })),
    globals: [],
  }) as unknown as SanitizedConfig

const builtFrom = (clientConfig: ClientConfig) =>
  (clientConfig as unknown as { builtFrom: SanitizedConfig }).builtFrom

describe('getClientConfig', () => {
  beforeEach(() => {
    global._payload_doNotCacheClientConfig = true
  })

  afterEach(() => {
    global._payload_clientConfigs = null
    global._payload_doNotCacheClientConfig = true
  })

  it('should reuse the cached client config for the same config and language', () => {
    const config = createConfig(['pages'])

    const first = getClientConfig({ config, i18n: createI18n('en'), importMap, user })
    const second = getClientConfig({ config, i18n: createI18n('en'), importMap, user })

    expect(second).toBe(first)
  })

  it('should rebuild the client config when called with a different config', () => {
    const previousConfig = createConfig(['pages'])
    const nextConfig = createConfig(['pages', 'posts'])

    getClientConfig({ config: previousConfig, i18n: createI18n('en'), importMap, user })
    const next = getClientConfig({ config: nextConfig, i18n: createI18n('en'), importMap, user })

    expect(builtFrom(next)).toBe(nextConfig)
  })

  it('should not return a client config of the previous config for another language', () => {
    const previousConfig = createConfig(['pages'])
    const nextConfig = createConfig(['pages', 'posts'])

    getClientConfig({ config: previousConfig, i18n: createI18n('en'), importMap, user })
    getClientConfig({ config: previousConfig, i18n: createI18n('fr'), importMap, user })
    getClientConfig({ config: nextConfig, i18n: createI18n('en'), importMap, user })
    const fr = getClientConfig({ config: nextConfig, i18n: createI18n('fr'), importMap, user })

    expect(builtFrom(fr)).toBe(nextConfig)
  })

  it('should rebuild the redacted client config for unauthenticated users too', () => {
    const previousConfig = createConfig(['pages'])
    const nextConfig = createConfig(['pages', 'posts'])

    getClientConfig({ config: previousConfig, i18n: createI18n('en'), importMap, user: null })
    const next = getClientConfig({
      config: nextConfig,
      i18n: createI18n('en'),
      importMap,
      user: null,
    })

    expect(builtFrom(next)).toBe(nextConfig)
    expect(next).toMatchObject({ unauthenticated: true })
  })
})
