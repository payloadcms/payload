import type { GenerateMetadataDescriptor } from 'payload'

import { formatMetadata } from '../../utilities/formatMetadata.js'

export const generateForgotPasswordMetadata: GenerateMetadataDescriptor = async ({
  config,
  i18n: { t },
}) =>
  formatMetadata({
    description: t('authentication:forgotPassword'),
    keywords: t('authentication:forgotPassword'),
    serverURL: config.serverURL,
    title: t('authentication:forgotPassword'),
  })
