import type { AcceptedLanguages } from '@payloadcms/translations'

import { initI18n } from '@payloadcms/translations'

import type { SanitizedConfig } from '../config/types.js'

export const getLocalI18n = async ({
  config,
  language,
}: {
  config: SanitizedConfig
  language: AcceptedLanguages
}) =>
  initI18n({
    config: config.i18n,
    context: 'api',
    language,
  })
