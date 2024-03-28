import { initI18n } from '@payloadcms/translations'
import { translations } from '@payloadcms/translations/api'

import type { SanitizedConfig } from '../config/types.js'

export const getLocalI18n = ({
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
