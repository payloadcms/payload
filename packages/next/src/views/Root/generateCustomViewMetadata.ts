import type { I18nClient } from '@payloadcms/translations'
import type { Metadata } from 'next'
import type {
  AdminViewConfig,
  MetaConfig,
  SanitizedCollectionConfig,
  SanitizedConfig,
  SanitizedGlobalConfig,
} from 'payload'

import { generateMetadata } from '../../utilities/generateMetadata.js'

/**
 * @todo Remove the `MetaConfig` type assertions. They are currently required because of how the `Metadata` type from `next` consumes the `URL` type.
 */
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
    ...((config.admin.meta || {}) as MetaConfig),
    ...(viewConfig.meta || {}),
    openGraph: {
      title: 'Payload',
      ...((config.admin.meta?.openGraph || {}) as MetaConfig['openGraph']),
      ...(viewConfig.meta?.openGraph || {}),
    },
  })
}
