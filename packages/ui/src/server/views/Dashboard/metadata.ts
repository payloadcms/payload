import type { GenerateViewMetadata } from 'payload'

import { formatMetadata } from '../../utilities/formatMetadata.js'

export const generateDashboardMetadata: GenerateViewMetadata = async ({ config, i18n: { t } }) =>
  formatMetadata({
    serverURL: config.serverURL,
    title: t('general:dashboard'),
    ...(config.admin.meta || {}),
    openGraph: {
      title: t('general:dashboard'),
      ...(config.admin.meta?.openGraph || {}),
    },
  })
