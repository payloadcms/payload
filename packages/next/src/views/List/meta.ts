import type { Metadata } from 'next'
import type { SanitizedCollectionConfig } from 'payload'

import { getTranslation } from '@payloadcms/translations'

import type { GenerateViewMetadata } from '../Root/index.js'

import { meta } from '../../utilities/meta.js'

export const generateListMetadata = async (
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

  return meta({
    ...(config.admin.meta || {}),
    description,
    keywords,
    serverURL: config.serverURL,
    title,
    ...(collectionConfig?.admin?.meta || {}),
  })
}
