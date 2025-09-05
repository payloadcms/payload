import type { SupportedLanguages } from '@payloadcms/translations'
import type { ClientConfig, CreateClientConfigArgs, DefaultDocumentIDType } from 'payload'

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

let cachedUser: DefaultDocumentIDType

export const getClientConfig = cache(
  ({ config, i18n, importMap, user }: CreateClientConfigArgs): ClientConfig => {
    const currentLanguage = i18n.language

    const userHasChanged = user?.id !== cachedUser

    if (
      cachedClientConfigs[currentLanguage] &&
      !global._payload_doNotCacheClientConfig &&
      !userHasChanged
    ) {
      return cachedClientConfigs[currentLanguage]
    }

    const cachedClientConfig = createClientConfig({
      config,
      i18n,
      importMap,
      user,
    })

    cachedClientConfigs[currentLanguage] = cachedClientConfig
    global._payload_clientConfigs = cachedClientConfigs
    global._payload_doNotCacheClientConfig = false

    return cachedClientConfig
  },
)
