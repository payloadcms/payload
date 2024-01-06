import { PayloadRequest, SanitizedConfig } from 'payload/types'
import { initI18n } from '@payloadcms/translations'
import { translations } from '@payloadcms/translations/client'

export const getNextI18n = ({
  config,
  language,
}: {
  config: SanitizedConfig
  language: string
}): PayloadRequest['i18n'] => {
  return initI18n({
    config,
    language,
    translations,
  })
}
