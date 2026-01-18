import type { I18nClient } from '@payloadcms/translations'
import type { Metadata } from 'next'
import type {
  AdminViewConfig,
  SanitizedCollectionConfig,
  SanitizedConfig,
  SanitizedGlobalConfig,
} from 'payload'

import { generateMetadata } from '../../utilities/meta.js'

export const generateCustomViewMetadata = async (args: {
  collectionConfig?: SanitizedCollectionConfig
  config: SanitizedConfig
  globalConfig?: SanitizedGlobalConfig
  i18n: I18nClient
  viewConfig: AdminViewConfig
}): Promise<Metadata> => {
  const {
    config,
    // i18n: { t },
    viewConfig,
  } = args

  if (!viewConfig) {
    return null
  }

  return generateMetadata({
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
