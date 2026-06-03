import type { GenerateMetadataDescriptor } from 'payload'

import { formatMetadata } from '../../utilities/formatMetadata.js'

export const generateDashboardMetadata = ({
  config,
  i18n: { t },
}: Parameters<GenerateMetadataDescriptor>[0]) =>
  formatMetadata({
    openGraph: {
      title: t('general:dashboard'),
    },
    serverURL: config.serverURL,
    title: t('general:dashboard'),
  })
