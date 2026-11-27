import type { SupportedLanguages } from '@payloadcms/translations'
import type { ClientConfig, CreateClientConfigArgs, SanitizedConfig } from 'payload'

import { createClientConfig, createUnauthenticatedClientConfig } from 'payload'
import { cache } from 'react'

type ClientConfigsByLanguage = Partial<Record<keyof SupportedLanguages, ClientConfig>>

/**
 * Client configs are cached per config object they were built from. After a config reload
 * in development, a request that is still rendering with the previous config must not
 * fill the cache that later requests (with the new config) read from.
 */
type CachedClientConfigs = WeakMap<SanitizedConfig, ClientConfigsByLanguage>

type GetClientConfigArgs = {
  user: CreateClientConfigArgs['user'] | null
} & Omit<CreateClientConfigArgs, 'user'>

const getCachedClientConfigs = (): CachedClientConfigs => {
  if (
    !(global._payload_clientConfigs instanceof WeakMap) ||
    global._payload_doNotCacheClientConfig
  ) {
    global._payload_clientConfigs = new WeakMap()
    global._payload_doNotCacheClientConfig = false
  }

  return global._payload_clientConfigs
}

export const getClientConfig = cache(
  ({ config, i18n, importMap, user }: GetClientConfigArgs): ClientConfig => {
    const currentLanguage = i18n.language
    const cachedClientConfigs = getCachedClientConfigs()

    let clientConfigsByLanguage = cachedClientConfigs.get(config)

    if (!clientConfigsByLanguage) {
      clientConfigsByLanguage = {}
      cachedClientConfigs.set(config, clientConfigsByLanguage)
    }

    let clientConfig = clientConfigsByLanguage[currentLanguage]

    if (!clientConfig) {
      clientConfig = createClientConfig({
        config,
        i18n,
        importMap,
        // Always cache the full config, then return its redacted version for unauthenticated users.
        user: true,
      })

      clientConfigsByLanguage[currentLanguage] = clientConfig
    }

    if (!user) {
      return createUnauthenticatedClientConfig({
        clientConfig,
      }) as unknown as ClientConfig
    }

    return clientConfig
  },
)
