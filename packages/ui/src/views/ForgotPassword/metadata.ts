import type { GenerateMetadataDescriptor } from 'payload'

export const generateForgotPasswordMetadata: GenerateMetadataDescriptor = ({
  config,
  i18n: { t },
}) =>
  Promise.resolve({
    description: t('authentication:forgotPassword'),
    keywords: t('authentication:forgotPassword'),
    serverURL: config.serverURL,
    title: t('authentication:forgotPassword'),
  })
