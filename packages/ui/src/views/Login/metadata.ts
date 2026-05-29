import type { GenerateMetadataDescriptor } from 'payload'

export const generateLoginMetadata: GenerateMetadataDescriptor = ({ config, i18n: { t } }) =>
  Promise.resolve({
    description: t('authentication:login'),
    keywords: t('authentication:login'),
    serverURL: config.serverURL,
    title: t('authentication:login'),
  })
