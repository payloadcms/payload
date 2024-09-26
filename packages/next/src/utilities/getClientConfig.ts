import type { I18nClient } from '@payloadcms/translations'
import type { ClientConfig, SanitizedConfig } from 'payload'

import { createClientConfig } from 'payload'
import { cache } from 'react'

export const getClientConfig = cache(
  async (args: { config: SanitizedConfig; i18n: I18nClient }): Promise<ClientConfig> => {
    const { config, i18n } = args

    const clientConfig = await createClientConfig({
      config,
      i18n,
    })

    return clientConfig
  },
)
