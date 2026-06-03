import type { GenerateViewMetadata } from 'payload'

import { formatMetadata } from '../../utilities/formatMetadata.js'

export const generateResetPasswordMetadata: GenerateViewMetadata = async ({
  config,
  i18n: { t },
}) =>
  formatMetadata({
    description: t('authentication:resetPassword'),
    keywords: t('authentication:resetPassword'),
    serverURL: config.serverURL,
    title: t('authentication:resetPassword'),
  })
