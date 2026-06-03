import type { GenerateMetadataDescriptor } from 'payload'

import { formatMetadata } from '../../utilities/formatMetadata.js'

export const generateAccountMetadata = ({
  config,
  i18n: { t },
}: Parameters<GenerateMetadataDescriptor>[0]) =>
  formatMetadata({
    description: t('authentication:accountOfCurrentUser'),
    keywords: t('authentication:account'),
    serverURL: config.serverURL,
    title: t('authentication:account'),
  })
