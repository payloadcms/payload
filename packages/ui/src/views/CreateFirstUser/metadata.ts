import type { GenerateMetadataDescriptor } from 'payload'

export const generateCreateFirstUserMetadata: GenerateMetadataDescriptor = ({
  config,
  i18n: { t },
}) =>
  Promise.resolve({
    description: t('authentication:createFirstUser'),
    keywords: t('general:create'),
    serverURL: config.serverURL,
    title: t('authentication:createFirstUser'),
  })
