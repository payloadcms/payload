import type { GenerateMetadataDescriptor } from 'payload'

export const generateAccountMetadata: GenerateMetadataDescriptor = ({ config, i18n: { t } }) =>
  Promise.resolve({
    description: t('authentication:accountOfCurrentUser'),
    keywords: t('authentication:account'),
    serverURL: config.serverURL,
    title: t('authentication:account'),
  })
