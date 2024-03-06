import { I18n } from '@payloadcms/translations'

export const generateNotFoundMeta = ({ i18n }: { i18n: I18n }) => {
  return {
    description: i18n.t('general:pageNotFound'),
    keywords: `404 ${i18n.t('general:notFound')}`,
    title: i18n.t('general:notFound'),
  }
}
