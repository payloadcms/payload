import type { SanitizedCollectionConfig } from 'payload'

import { getTranslation } from '@payloadcms/translations'

import type { ViewMetadata } from '../../utilities/meta.js'
import type { GenerateViewMetadata } from '../types.js'

import { generateMetadata } from '../../utilities/meta.js'

export const generateCollectionTrashMetadata = async (
  args: {
    collectionConfig: SanitizedCollectionConfig
  } & Parameters<GenerateViewMetadata>[0],
): Promise<ViewMetadata> => {
  const { collectionConfig, config, i18n } = args

  let title: string = ''
  const description: string = ''
  const keywords: string = ''

  if (collectionConfig) {
    title = getTranslation(collectionConfig.labels.plural, i18n)
  }

  title = `${title ? `${title} ` : title}${i18n.t('general:trash')}`

  return generateMetadata({
    ...(config.admin.meta || {}),
    description,
    keywords,
    serverURL: config.serverURL,
    title,
    ...(collectionConfig?.admin?.meta || {}),
  })
}
