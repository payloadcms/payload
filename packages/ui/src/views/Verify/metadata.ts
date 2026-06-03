import type { GenerateMetadataDescriptor } from 'payload'

import { formatMetadata } from '../../utilities/formatMetadata.js'

export const generateVerifyMetadata: GenerateMetadataDescriptor = async ({ config, i18n: { t } }) =>
  formatMetadata({
    description: t('authentication:verifyUser'),
    keywords: t('authentication:verify'),
    serverURL: config.serverURL,
    title: t('authentication:verify'),
  })
