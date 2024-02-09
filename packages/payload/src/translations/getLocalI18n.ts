import { initI18n } from '@payloadcms/translations'

import type { SanitizedConfig } from '../exports/types'

export const getLocalI18n = async ({
  config,
  language = 'en',
}: {
  config: SanitizedConfig
  language?: string
}) =>
  initI18n({
    config: config.i18n,
    language,
    translationsContext: 'api',
  })
