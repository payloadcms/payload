import type { GenerateMetadataDescriptor } from 'payload'

import { formatMetadata } from '../../utilities/formatMetadata.js'

export const generateResetPasswordMetadata: GenerateMetadataDescriptor = async ({
  config,
  i18n: { t },
}) =>
  formatMetadata({
    description: t('authentication:resetPassword'),
    keywords: t('authentication:resetPassword'),
    serverURL: config.serverURL,
    title: t('authentication:resetPassword'),
  })
