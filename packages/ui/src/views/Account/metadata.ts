import type { GenerateMetadataDescriptor } from 'payload'

import { formatMetadata } from '../../utilities/formatMetadata.js'

export const generateAccountMetadata: GenerateMetadataDescriptor = async ({
  config,
  i18n: { t },
}) =>
  formatMetadata({
    description: t('authentication:accountOfCurrentUser'),
    keywords: t('authentication:account'),
    serverURL: config.serverURL,
    title: t('authentication:account'),
  })
