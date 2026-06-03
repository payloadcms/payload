import type { I18nClient } from '@payloadcms/translations'
import type { MetaConfig, SanitizedCollectionConfig, SanitizedConfig } from 'payload'

import { getTranslation } from '@payloadcms/translations'

import { formatMetadata } from '../../utilities/formatMetadata.js'

export const generateListViewMetadata = async (args: {
  collectionConfig: SanitizedCollectionConfig
  config: SanitizedConfig
  i18n: I18nClient
  params?: { [key: string]: string | string[] }
}): Promise<MetaConfig> => {
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
