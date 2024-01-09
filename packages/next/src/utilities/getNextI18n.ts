import { SanitizedConfig } from 'payload/types'
import { initI18n } from '@payloadcms/translations'
import { translations as clientTranslations } from '@payloadcms/translations/client'
import { translations as apiTranslations } from '@payloadcms/translations/api'

export const getNextI18n = ({
  config,
  language,
  translationContext = 'client',
}: {
  config: SanitizedConfig
  language: string
  translationContext?: 'api' | 'client'
}): ReturnType<typeof initI18n> => {
  return initI18n({
    config: config.i18n,
    language,
    translations: translationContext === 'api' ? apiTranslations : clientTranslations,
  })
}
