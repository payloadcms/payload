import type { GenerateMetadataDescriptor } from 'payload'

import { formatMetadata } from '../../utilities/formatMetadata.js'

export const generateLogoutMetadata = ({
  config,
  i18n: { t },
}: Parameters<GenerateMetadataDescriptor>[0]) =>
  formatMetadata({
    description: `${t('authentication:logoutUser')}`,
    keywords: `${t('authentication:logout')}`,
    serverURL: config.serverURL,
    title: t('authentication:logout'),
  })
