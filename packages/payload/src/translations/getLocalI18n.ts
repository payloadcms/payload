import { initTFunction } from '@payloadcms/translations'
import { translations } from '@payloadcms/translations/api'

import type { PayloadRequest, SanitizedConfig } from '../exports/types'

export const getLocalI18n = ({
  config,
  language = 'en',
}: {
  config: SanitizedConfig
  language?: string
}): PayloadRequest['i18n'] => {
  return {
    fallbackLanguage: config.i18n.fallbackLanguage,
    language: language || config.i18n.fallbackLanguage,
    t: initTFunction({
      config,
      language: language || config.i18n.fallbackLanguage,
      translations,
    }),
  }
}
