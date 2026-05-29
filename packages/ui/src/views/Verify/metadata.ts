import type { GenerateMetadataDescriptor } from 'payload'

export const generateVerifyMetadata: GenerateMetadataDescriptor = ({ config, i18n: { t } }) =>
  Promise.resolve({
    description: t('authentication:verifyUser'),
    keywords: t('authentication:verify'),
    serverURL: config.serverURL,
    title: t('authentication:verify'),
  })
