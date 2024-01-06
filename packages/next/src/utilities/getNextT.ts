import { translations } from '@payloadcms/translations/client'

import type { PayloadRequest, SanitizedConfig } from 'payload/types'

import { initTFunction } from '@payloadcms/translations'
import { cookies, headers } from 'next/headers'
import { getRequestLanguage } from './getRequestLanguage'

export const getNextT = ({
  config,
  language,
}: {
  config: SanitizedConfig
  language?: string
}): PayloadRequest['i18n']['t'] => {
  const lang = language || getRequestLanguage({ cookies: cookies(), headers: headers() })

  return initTFunction({
    language: lang,
    config,
    translations,
  })
}
