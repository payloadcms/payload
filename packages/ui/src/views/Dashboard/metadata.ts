import type { GenerateMetadataDescriptor } from 'payload'

import { formatMetadata } from '../../utilities/formatMetadata.js'

export const generateDashboardMetadata: GenerateMetadataDescriptor = async ({
  config,
  i18n: { t },
}) =>
  formatMetadata({
    openGraph: {
      title: t('general:dashboard'),
    },
    serverURL: config.serverURL,
    title: t('general:dashboard'),
  })
