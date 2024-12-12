import type { I18nClient } from '@payloadcms/translations'
import type { ClientConfig, ImportMap, SanitizedConfig } from 'payload'

import { createClientConfig } from 'payload'
import { cache } from 'react'

let cachedClientConfig = global._payload_clientConfig

if (!cachedClientConfig) {
  cachedClientConfig = global._payload_clientConfig = null
}

export const getClientConfig = cache(
  (args: { config: SanitizedConfig; i18n: I18nClient; importMap: ImportMap }): ClientConfig => {
    if (cachedClientConfig && !global._payload_doNotCacheClientConfig) {
      return cachedClientConfig
    }

    const { config, i18n, importMap } = args

    cachedClientConfig = createClientConfig({
      config,
      i18n,
      importMap,
    })

    global._payload_clientConfig = cachedClientConfig

    global._payload_doNotCacheClientConfig = false

    return cachedClientConfig
  },
)
