import { I18n } from '@payloadcms/translations'
import { meta } from '../../utilities/meta'
import { SanitizedConfig } from 'payload/types'

export const generateNotFoundMeta = ({ config, i18n }: { config: SanitizedConfig; i18n: I18n }) => {
  return meta({
    config,
    description: i18n.t('general:pageNotFound'),
    keywords: `404 ${i18n.t('general:notFound')}`,
    title: i18n.t('general:notFound'),
  })
}
