import type { GenerateMetadataDescriptor } from 'payload'

import { formatMetadata } from '../../utilities/formatMetadata.js'

export const generateLogoutMetadata: GenerateMetadataDescriptor = async ({ config, i18n: { t } }) =>
  formatMetadata({
    description: `${t('authentication:logoutUser')}`,
    keywords: `${t('authentication:logout')}`,
    serverURL: config.serverURL,
    title: t('authentication:logout'),
  })
