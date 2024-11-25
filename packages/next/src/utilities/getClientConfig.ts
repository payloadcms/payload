import type { I18nClient } from '@payloadcms/translations'
import type { ClientConfig, ImportMap, SanitizedConfig } from 'payload'

import { createClientConfig } from 'payload'
import { cache } from 'react'

export const getClientConfig = cache(
  async (args: {
    config: SanitizedConfig
    i18n: I18nClient
    importMap: ImportMap
  }): Promise<ClientConfig> => {
    const { config, i18n, importMap } = args

    const clientConfig = createClientConfig({
      config,
      i18n,
      importMap,
    })

    return Promise.resolve(clientConfig)
  },
)
