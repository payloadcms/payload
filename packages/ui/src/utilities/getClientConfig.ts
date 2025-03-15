import type { I18nClient } from '@payloadcms/translations'
import type { ClientConfig, ImportMap, SanitizedConfig } from 'payload'

import { createClientConfig } from 'payload'
import { cache } from 'react'

let cachedClientConfigs: Record<string, ClientConfig> = global._payload_localizedClientConfigs

if (!cachedClientConfigs) {
  cachedClientConfigs = global._payload_localizedClientConfigs = {}
}

export const getClientConfig = cache(
  (args: { config: SanitizedConfig; i18n: I18nClient; importMap: ImportMap }): ClientConfig => {
    const { config, i18n, importMap } = args
    const currentLocale = i18n.language

    if (cachedClientConfigs[currentLocale] && !global._payload_doNotCacheClientConfig) {
      return cachedClientConfigs[currentLocale]
    }

    const cachedClientConfig = createClientConfig({
      config,
      i18n,
      importMap,
    })

    cachedClientConfigs[currentLocale] = cachedClientConfig
    global._payload_localizedClientConfigs = cachedClientConfigs
    global._payload_doNotCacheClientConfig = false

    return cachedClientConfig
  },
)
