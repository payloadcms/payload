import type { Metadata } from 'next'

import { getTranslation } from '@payloadcms/translations'

import type { GenerateEditViewMetadata } from '../Document/getMetaBySegment.d.ts'

import { meta } from '../../utilities/meta.js'

export const generateMetadata: GenerateEditViewMetadata = async ({
  collectionConfig,
  config,
  globalConfig,
  i18n,
  isEditing,
}): Promise<Metadata> => {
  const { t } = i18n

  let description: string = ''
  let title: string = ''
  let keywords: string = ''

  if (collectionConfig) {
    description = `${isEditing ? t('general:editing') : t('general:creating')} - ${getTranslation(
      collectionConfig.labels.singular,
      i18n,
    )}`

    title = `${isEditing ? t('general:editing') : t('general:creating')} - ${getTranslation(
      collectionConfig.labels.singular,
      i18n,
    )}`

    keywords = `${getTranslation(collectionConfig.labels.singular, i18n)}, Payload, CMS`
  }

  if (globalConfig) {
    description = getTranslation(globalConfig.label, i18n)
    keywords = `${getTranslation(globalConfig.label, i18n)}, Payload, CMS`
    title = getTranslation(globalConfig.label, i18n)
  }

  return meta({
    config,
    description,
    keywords,
    title,
  })
}
