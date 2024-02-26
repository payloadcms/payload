import type { I18n } from '@payloadcms/translations'
import type { SanitizedConfig } from 'payload/types'

import { initI18n } from '@payloadcms/translations'
import { translations } from '@payloadcms/translations/client'
import { cookies, headers } from 'next/headers'

import { getRequestLanguage } from './getRequestLanguage'

export const getNextI18n = async ({
  config,
  language,
}: {
  config: SanitizedConfig
  language?: string
}): Promise<I18n> => {
  const i18n = initI18n({
    config: config.i18n,
    context: 'client',
    language: language || getRequestLanguage({ cookies: cookies(), headers: headers() }),
    translations,
  })

  return i18n
}
