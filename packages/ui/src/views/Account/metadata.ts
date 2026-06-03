import type { GenerateViewMetadata } from 'payload'

import { formatMetadata } from '../../utilities/formatMetadata.js'

export const generateAccountMetadata: GenerateViewMetadata = async ({ config, i18n: { t } }) =>
  formatMetadata({
    description: t('authentication:accountOfCurrentUser'),
    keywords: t('authentication:account'),
    serverURL: config.serverURL,
    title: t('authentication:account'),
  })
