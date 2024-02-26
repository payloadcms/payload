import type { Metadata } from 'next'

import { getTranslation } from '@payloadcms/translations'

import type { GenerateEditViewMetadata } from '../Document/getMetaBySegment'

import { meta } from '../../utilities/meta'

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
    title = t('editing')
    ;(keywords = `${getTranslation(collectionConfig.labels.singular, i18n)}, Payload, CMS`),
      (title = `${isEditing ? t('editing') : t('creating')} - ${getTranslation(
        collectionConfig.labels.singular,
        i18n,
      )}`)
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
