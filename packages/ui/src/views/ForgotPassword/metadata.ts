import type { GenerateViewMetadata } from 'payload'

import { formatMetadata } from '../../utilities/formatMetadata.js'

export const generateForgotPasswordMetadata: GenerateViewMetadata = async ({
  config,
  i18n: { t },
}) =>
  formatMetadata({
    description: t('authentication:forgotPassword'),
    keywords: t('authentication:forgotPassword'),
    serverURL: config.serverURL,
    title: t('authentication:forgotPassword'),
    ...(config.admin.meta || {}),
  })
