import type { GenerateViewMetadata } from 'payload'

import { formatMetadata } from '../../utilities/formatMetadata.js'

export const generateCreateFirstUserMetadata: GenerateViewMetadata = async ({
  config,
  i18n: { t },
}) =>
  formatMetadata({
    description: t('authentication:createFirstUser'),
    keywords: t('general:create'),
    serverURL: config.serverURL,
    title: t('authentication:createFirstUser'),
    ...(config.admin.meta || {}),
  })
