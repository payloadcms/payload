import type { Metadata } from 'next'
import type { MetaConfig, SanitizedCollectionConfig } from 'payload'

import { getTranslation } from '@payloadcms/translations'

import type { GenerateViewMetadata } from '../Root/index.js'

import { generateMetadata } from '../../utilities/generateMetadata.js'

/**
 * @todo Remove the `MetaConfig` type assertions. They are currently required because of how the `Metadata` type from `next` consumes the `URL` type.
 */
export const generateListViewMetadata = async (
  args: {
    collectionConfig: SanitizedCollectionConfig
  } & Parameters<GenerateViewMetadata>[0],
): Promise<Metadata> => {
  const { collectionConfig, config, i18n } = args

  let title: string = ''
  const description: string = ''
  const keywords: string = ''

  if (collectionConfig) {
    title = getTranslation(collectionConfig.labels.plural, i18n)
  }

  return generateMetadata({
    ...((config.admin.meta || {}) as MetaConfig),
    description,
    keywords,
    serverURL: config.serverURL,
    title,
    ...((collectionConfig?.admin?.meta || {}) as MetaConfig),
  })
}
