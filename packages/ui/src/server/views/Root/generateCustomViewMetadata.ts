import type { I18nClient } from '@payloadcms/translations'
import type {
  AdminViewConfig,
  MetaConfig,
  SanitizedCollectionConfig,
  SanitizedConfig,
  SanitizedGlobalConfig,
} from 'payload'

import { formatMetadata } from '../../utilities/formatMetadata.js'

export const generateCustomViewMetadata = async (args: {
  collectionConfig?: SanitizedCollectionConfig
  config: SanitizedConfig
  globalConfig?: SanitizedGlobalConfig
  i18n: I18nClient
  viewConfig: AdminViewConfig
}): Promise<MetaConfig> => {
  const {
    config,
    // i18n: { t },
    viewConfig,
  } = args

  if (!viewConfig) {
    return null
  }

  return formatMetadata({
    description: `Payload`,
    keywords: `Payload`,
    serverURL: config.serverURL,
    title: 'Payload',
    ...(config.admin.meta || {}),
    ...(viewConfig.meta || {}),
    openGraph: {
      title: 'Payload',
      ...(config.admin.meta?.openGraph || {}),
      ...(viewConfig.meta?.openGraph || {}),
    },
  })
}
