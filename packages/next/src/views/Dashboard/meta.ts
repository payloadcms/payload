import type { GenerateViewMetadata } from '../Root/index.js'

import { meta } from '../../utilities/meta.js'

export const generateDashboardMetadata: GenerateViewMetadata = async ({ config, i18n: { t } }) =>
  meta({
    description: `${t('general:dashboard')} Payload`,
    keywords: `${t('general:dashboard')}, Payload`,
    serverURL: config.serverURL,
    title: t('general:dashboard'),
    ...(config.admin.meta || {}),
    openGraph: {
      title: t('general:dashboard'),
      ...(config.admin.meta?.openGraph || {}),
    },
  })
