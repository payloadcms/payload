import type { GenerateMetadataDescriptor } from 'payload'

import { formatMetadata } from '../../utilities/formatMetadata.js'

export const generateForgotPasswordMetadata = ({
  config,
  i18n: { t },
}: Parameters<GenerateMetadataDescriptor>[0]) =>
  formatMetadata({
    description: t('authentication:forgotPassword'),
    keywords: t('authentication:forgotPassword'),
    serverURL: config.serverURL,
    title: t('authentication:forgotPassword'),
  })
