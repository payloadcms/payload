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

  let description: string = ''
  let title: string = ''
  let entityLabel: string = ''
  let keywords: string = ''

  if (collectionConfig) {
    entityLabel = getTranslation(collectionConfig.labels.singular, i18n)
    description = `${isEditing ? t('general:editing') : t('general:creating')} - ${entityLabel}`
    title = `${isEditing ? t('general:editing') : t('general:creating')} - ${entityLabel}`
    keywords = `${getTranslation(collectionConfig.labels.singular, i18n)}, Payload, CMS`
  }

  if (globalConfig) {
    entityLabel = getTranslation(globalConfig.label, i18n)
    description = getTranslation(globalConfig.label, i18n)
    title = getTranslation(globalConfig.label, i18n)
    keywords = `${getTranslation(globalConfig.label, i18n)}, Payload, CMS`
  }

  return Promise.resolve(
    meta({
      config,
      description,
      keywords,
      openGraph: {
        description: entityLabel,
        title: entityLabel,
      },
      title,
    }),
  )
}
