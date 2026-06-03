import type { GenerateViewMetadata } from 'payload'

import { formatMetadata } from '../../utilities/formatMetadata.js'

export const generateLoginMetadata: GenerateViewMetadata = async ({ config, i18n: { t } }) =>
  formatMetadata({
    description: t('authentication:login'),
    keywords: t('authentication:login'),
    serverURL: config.serverURL,
    title: t('authentication:login'),
  })
