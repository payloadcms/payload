import type { GenerateMetadataDescriptor } from 'payload'

import { formatMetadata } from '../../utilities/formatMetadata.js'

export const generateNotFoundMetadata: GenerateMetadataDescriptor = async ({
  config,
  i18n: { t },
}) =>
  formatMetadata({
    description: t('general:pageNotFound'),
    keywords: `404 ${t('general:notFound')}`,
    serverURL: config.serverURL,
    title: t('general:notFound'),
  })
