import type { GenerateViewMetadata } from 'payload'

import { formatMetadata } from '../../utilities/formatMetadata.js'

export const generateUnauthorizedMetadata: GenerateViewMetadata = async ({ config, i18n: { t } }) =>
  formatMetadata({
    description: t('error:unauthorized'),
    keywords: t('error:unauthorized'),
    serverURL: config.serverURL,
    title: t('error:unauthorized'),
  })
