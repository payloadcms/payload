import type { Metadata } from 'next'

import { getTranslation } from '@payloadcms/translations'

import type { GenerateEditViewMetadata } from '../Document/getMetaBySegment.js'

import { meta } from '../../utilities/meta.js'

export const generateMetadata: GenerateEditViewMetadata = async ({
  collectionConfig,
  config,
  globalConfig,
  i18n,
}): Promise<Metadata> => {
  const { t } = i18n

  const entityLabel = collectionConfig
    ? getTranslation(collectionConfig.labels.singular, i18n)
    : globalConfig
      ? getTranslation(globalConfig.label, i18n)
      : ''

  let title: string = ''
  let description: string = ''
  const keywords: string = ''

  const data: any = {} // TODO: figure this out

  if (collectionConfig) {
    const useAsTitle = collectionConfig?.admin?.useAsTitle || 'id'
    const titleFromData = data?.[useAsTitle]
    title = `${t('version:versions')}${titleFromData ? ` - ${titleFromData}` : ''} - ${entityLabel}`
    description = t('version:viewingVersions', {
      documentTitle: data?.[useAsTitle],
      entitySlug: collectionConfig.slug,
    })
  }

  if (globalConfig) {
    title = `${t('version:versions')} - ${entityLabel}`
    description = t('version:viewingVersionsGlobal', { entitySlug: globalConfig.slug })
  }

  return meta({
    ...(config.admin.meta || {}),
    description,
    keywords,
    serverURL: config.serverURL,
    title,
    ...(collectionConfig?.admin.meta || {}),
    ...(globalConfig?.admin.meta || {}),
  })
}
