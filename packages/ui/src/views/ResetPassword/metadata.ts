import type { GenerateMetadataDescriptor } from 'payload'

export const generateResetPasswordMetadata: GenerateMetadataDescriptor = ({
  config,
  i18n: { t },
}) =>
  Promise.resolve({
    description: t('authentication:resetPassword'),
    keywords: t('authentication:resetPassword'),
    serverURL: config.serverURL,
    title: t('authentication:resetPassword'),
  })
