import type { I18nClient, SupportedLanguages } from '@payloadcms/translations'
import type { ClientConfig, ImportMap, SanitizedConfig } from 'payload'

import { createClientConfig } from 'payload'
import { cache } from 'react'

let cachedClientConfigs = global._payload_clientConfigs as Record<
  keyof SupportedLanguages,
  ClientConfig
>

if (!cachedClientConfigs) {
  cachedClientConfigs = global._payload_clientConfigs = {} as Record<
    keyof SupportedLanguages,
    ClientConfig
  >
}

export const getClientConfig = cache(
  (args: { config: SanitizedConfig; i18n: I18nClient; importMap: ImportMap }): ClientConfig => {
    const { config, i18n, importMap } = args
    const currentLanguage = i18n.language

    if (cachedClientConfigs[currentLanguage] && !global._payload_doNotCacheClientConfig) {
      return cachedClientConfigs[currentLanguage]
    }

    const cachedClientConfig = createClientConfig({
      config,
      i18n,
      importMap,
    })

    cachedClientConfigs[currentLanguage] = cachedClientConfig
    global._payload_clientConfigs = cachedClientConfigs
    global._payload_doNotCacheClientConfig = false

    return cachedClientConfig
  },
)
