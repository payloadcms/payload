import type { MetaConfig } from 'payload'

import type { GenerateViewMetadata } from '../Root/index.js'

import { generateMetadata } from '../../utilities/generateMetadata.js'

/**
 * @todo Remove the type assertion. This is currently required because of how the `Metadata` type from `next` consumes the `URL` type.
 */
export const generateDashboardViewMetadata: GenerateViewMetadata = async ({
  config,
  i18n: { t },
}) =>
  generateMetadata({
    serverURL: config.serverURL,
    title: t('general:dashboard'),
    ...(config.admin.meta as MetaConfig),
    openGraph: {
      title: t('general:dashboard'),
      ...((config.admin.meta?.openGraph || {}) as MetaConfig['openGraph']),
    },
  })
