import { initI18n } from '@payloadcms/translations'
import { translations } from '@payloadcms/translations/api'

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
    context: 'api',
    language,
    translations,
  })
