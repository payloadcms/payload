import type { GenerateMetadataDescriptor } from 'payload'

import { formatMetadata } from '../../utilities/formatMetadata.js'

export const generateNotFoundMetadata = ({
  config,
  i18n: { t },
}: Parameters<GenerateMetadataDescriptor>[0]) =>
  formatMetadata({
    description: t('general:pageNotFound'),
    keywords: `404 ${t('general:notFound')}`,
    serverURL: config.serverURL,
    title: t('general:notFound'),
  })
