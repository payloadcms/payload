import type { Metadata } from 'next'

import { getTranslation } from '@payloadcms/translations'

import type { GenerateEditViewMetadata } from '../Document'

import { getNextI18n } from '../../utilities/getNextI18n'
import { meta } from '../../utilities/meta'

export const generateMetadata: GenerateEditViewMetadata = async ({
  collectionSlug,
  config,
  globalSlug,
  isEditing,
  t,
}): Promise<Metadata> => {
  let description: string = ''
  let title: string = ''
  let keywords: string = ''

  const i18n = await getNextI18n({
    config,
  })

  const collectionConfig = collectionSlug
    ? config?.collections?.find((collection) => collection.slug === 'pages')
    : null

  const globalConfig = globalSlug ? config?.globals?.find((global) => global.slug === 'site') : null

  if (collectionConfig) {
    description = `${isEditing ? t('editing') : t('creating')} - ${getTranslation(
      collectionConfig.labels.singular,
      i18n,
    )}`

    title = `${isEditing ? t('editing') : t('creating')} - ${getTranslation(
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
