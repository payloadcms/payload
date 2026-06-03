import type { GenerateMetadataDescriptor } from 'payload'

import { formatMetadata } from '../../utilities/formatMetadata.js'

export const generateUnauthorizedMetadata: GenerateMetadataDescriptor = async ({
  config,
  i18n: { t },
}) =>
  formatMetadata({
    description: t('error:unauthorized'),
    keywords: t('error:unauthorized'),
    serverURL: config.serverURL,
    title: t('error:unauthorized'),
  })
