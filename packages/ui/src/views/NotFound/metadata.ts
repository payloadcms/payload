import type { GenerateMetadataDescriptor } from 'payload'

export const generateNotFoundMetadata: GenerateMetadataDescriptor = ({ config, i18n: { t } }) =>
  Promise.resolve({
    description: t('general:pageNotFound'),
    keywords: `404 ${t('general:notFound')}`,
    serverURL: config.serverURL,
    title: t('general:notFound'),
  })
