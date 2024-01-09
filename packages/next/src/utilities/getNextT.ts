import { translations } from '@payloadcms/translations/client'
import type { TFunction } from '@payloadcms/translations'

import type { SanitizedConfig } from 'payload/types'

import { initTFunction } from '@payloadcms/translations'
import { cookies, headers } from 'next/headers'
import { getRequestLanguage } from './getRequestLanguage'

export const getNextT = ({
  config,
  language,
}: {
  config: SanitizedConfig
  language?: string
}): TFunction => {
  const lang = language || getRequestLanguage({ cookies: cookies(), headers: headers() })

  return initTFunction({
    language: lang,
    config: config.i18n,
    translations,
  })
}
