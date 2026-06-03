import type { GenerateMetadataDescriptor } from 'payload'

import { formatMetadata } from '../../utilities/formatMetadata.js'

export const generateCreateFirstUserMetadata = ({
  config,
  i18n: { t },
}: Parameters<GenerateMetadataDescriptor>[0]) =>
  formatMetadata({
    description: t('authentication:createFirstUser'),
    keywords: t('general:create'),
    serverURL: config.serverURL,
    title: t('authentication:createFirstUser'),
  })
