import { initI18n } from '@payloadcms/translations'
import { translations } from '@payloadcms/translations/api'

import type { SanitizedConfig } from '../exports/types'

export const getLocalI18n = ({
  config,
  language = 'en',
}: {
  config: SanitizedConfig
  language?: string
}): ReturnType<typeof initI18n> =>
  initI18n({
    config,
    language,
    translations,
  })
