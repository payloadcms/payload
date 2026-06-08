import type { GenerateViewMetadata, MetaConfig, SanitizedCollectionConfig } from 'payload'

import { getTranslation } from '@payloadcms/translations'

import { formatMetadata } from '../../utilities/formatMetadata.js'

export const generateListViewMetadata = async (
  args: {
    collectionConfig: SanitizedCollectionConfig
  } & Parameters<GenerateViewMetadata>[0],
): Promise<MetaConfig> => {
  const { collectionConfig, config, i18n } = args

  let title: string = ''
  const description: string = ''
  const keywords: string = ''

  if (collectionConfig) {
    title = getTranslation(collectionConfig.labels.plural, i18n)
  }

  return formatMetadata({
    ...(config.admin.meta || {}),
    description,
    keywords,
    serverURL: config.serverURL,
    title,
    ...(collectionConfig?.admin?.meta || {}),
  })
}
