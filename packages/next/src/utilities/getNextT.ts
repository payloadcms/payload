import type { TFunction } from '@payloadcms/translations'

import type { SanitizedConfig } from 'payload/types'

import { initI18n } from '@payloadcms/translations'
import { cookies, headers } from 'next/headers'
import { getRequestLanguage } from './getRequestLanguage'

export const getNextT = async ({
  config,
  language,
}: {
  config: SanitizedConfig
  language?: string
}): Promise<TFunction> => {
  const i18n = await initI18n({
    translationsContext: 'client',
    language: language || getRequestLanguage({ cookies: cookies(), headers: headers() }),
    config: config.i18n,
  })

  return i18n.t
}
