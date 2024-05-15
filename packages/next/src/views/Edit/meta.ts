import type { Metadata } from 'next'

import { getTranslation } from '@payloadcms/translations'

import type { GenerateEditViewMetadata } from '../Document/getMetaBySegment.js'

import { meta } from '../../utilities/meta.js'

export const generateMetadata: GenerateEditViewMetadata = async ({
  collectionConfig,
  config,
  globalConfig,
  i18n,
  isEditing,
}): Promise<Metadata> => {
  const { t } = i18n

  const entityLabel = collectionConfig
    ? getTranslation(collectionConfig.labels.singular, i18n)
    : globalConfig
      ? getTranslation(globalConfig.label, i18n)
      : ''

  const metaTitle = `${isEditing ? t('general:editing') : t('general:creating')} - ${entityLabel}`

  const ogTitle = `${isEditing ? t('general:edit') : t('general:edit')} - ${entityLabel}`

  const description = collectionConfig
    ? collectionConfig.admin?.meta?.description
    : globalConfig
      ? globalConfig.admin?.meta?.description
      : `${isEditing ? t('general:editing') : t('general:creating')} - ${entityLabel}`

  const keywords = `${entityLabel}, Payload, CMS`

  const baseOGOverrides = config.admin.meta.openGraph || {}

  const entityOGOverrides = collectionConfig
    ? collectionConfig.admin?.meta?.openGraph
    : globalConfig
      ? globalConfig.admin?.meta?.openGraph
      : {}

  return meta({
    config,
    description,
    keywords,
    openGraph: {
      description: entityLabel,
      title: ogTitle,
      ...baseOGOverrides,
      ...entityOGOverrides,
    },
    title: metaTitle,
  })
}
