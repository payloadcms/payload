import type { GenerateMetadataDescriptor } from 'payload'

import { formatMetadata } from '../../utilities/formatMetadata.js'

export const generateCreateFirstUserMetadata: GenerateMetadataDescriptor = async ({
  config,
  i18n: { t },
}) =>
  formatMetadata({
    description: t('authentication:createFirstUser'),
    keywords: t('general:create'),
    serverURL: config.serverURL,
    title: t('authentication:createFirstUser'),
  })
