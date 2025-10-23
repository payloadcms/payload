import type { SupportedLanguages } from '@payloadcms/translations'
import type { ClientConfig, CreateClientConfigArgs } from 'payload'

import { createClientConfig, createUnauthenticatedClientConfig } from 'payload'
import { cache } from 'react'

type CachedClientConfigs = Record<keyof SupportedLanguages, ClientConfig>

let cachedClientConfigs = global._payload_clientConfigs as CachedClientConfigs

if (!cachedClientConfigs) {
  cachedClientConfigs = global._payload_clientConfigs = {} as CachedClientConfigs
}

export const getClientConfig = cache(
  async ({ config, i18n, importMap, req, user }: CreateClientConfigArgs): Promise<ClientConfig> => {
    const currentLanguage = i18n.language

    if (cachedClientConfigs[currentLanguage] && !global._payload_doNotCacheClientConfig) {
      if (!user) {
        return createUnauthenticatedClientConfig({
          clientConfig: cachedClientConfigs[currentLanguage],
        }) as unknown as ClientConfig
      }

      const clientConfig = cachedClientConfigs[currentLanguage]

      const configWithFilteredLocales = await applyLocaleFiltering({ clientConfig, config, req })
      if (configWithFilteredLocales) {
        return configWithFilteredLocales
      }

      return clientConfig
    }

    const cachedClientConfig = createClientConfig({
      config,
      i18n,
      importMap,
      req,
      user,
    })

    const configWithFilteredLocales = await applyLocaleFiltering({
      clientConfig: cachedClientConfig,
      config,
      req,
    })
    if (configWithFilteredLocales) {
      Object.assign(cachedClientConfig, configWithFilteredLocales)
    }

    cachedClientConfigs[currentLanguage] = cachedClientConfig
    global._payload_clientConfigs = cachedClientConfigs
    global._payload_doNotCacheClientConfig = false

    if (!user) {
      return createUnauthenticatedClientConfig({
        clientConfig: cachedClientConfig,
      }) as unknown as ClientConfig
    }

    return cachedClientConfig
  },
)

async function applyLocaleFiltering({
  clientConfig,
  config,
  req,
}: {
  clientConfig: ClientConfig
  config: CreateClientConfigArgs['config']
  req: CreateClientConfigArgs['req']
}): Promise<ClientConfig | null> {
  if (
    !clientConfig.localization ||
    !config.localization ||
    typeof config.localization.filterAvailableLocales !== 'function'
  ) {
    return null
  }

  const filteredLocales = (
    await config.localization.filterAvailableLocales({
      locales: config.localization.locales,
      req,
    })
  ).map(({ toString, ...rest }) => rest)

  return {
    ...clientConfig,
    localization: {
      ...clientConfig.localization,
      localeCodes: filteredLocales.map(({ code }) => code),
      locales: filteredLocales,
    },
  }
}
