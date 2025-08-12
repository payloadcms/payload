import type { GenerateViewMetadata } from '../Root/index.js'

import { generateMetadata } from '../../utilities/meta.js'

export const generateDashboardViewMetadata: GenerateViewMetadata = async ({
  config,
  i18n: { t },
}) =>
  generateMetadata({
    serverURL: config.serverURL,
    title: t('general:dashboard'),
    ...config.admin.meta,
    openGraph: {
      title: t('general:dashboard'),
      ...(config.admin.meta?.openGraph || {}),
    },
  })
