import type { GenerateMetadataDescriptor } from 'payload'

export const generateUnauthorizedMetadata: GenerateMetadataDescriptor = ({ config, i18n: { t } }) =>
  Promise.resolve({
    description: t('error:unauthorized'),
    keywords: t('error:unauthorized'),
    serverURL: config.serverURL,
    title: t('error:unauthorized'),
  })
