import type { Metadata } from 'next'
import type { SanitizedCollectionConfig } from 'payload'

import { getTranslation } from '@payloadcms/translations'

import type { GenerateViewMetadata } from '../Root/index.js'

import { generateMetadata } from '../../utilities/meta.js'

export const generateCollectionFolderMetadata = async (
  args: {
    collectionConfig: SanitizedCollectionConfig
  } & Parameters<GenerateViewMetadata>[0],
): Promise<Metadata> => {
  const { collectionConfig, config, i18n } = args

  let title: string = ''
  const description: string = ''
  const keywords: string = ''

  if (collectionConfig) {
    title = getTranslation(collectionConfig.labels.singular, i18n)
  }

  title = `${title ? `${title} ` : title}${i18n.t('folder:folders')}`

  return generateMetadata({
    ...(config.admin.meta || {}),
    description,
    keywords,
    serverURL: config.serverURL,
    title,
    ...(collectionConfig?.admin?.meta || {}),
  })
}
