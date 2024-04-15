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

  let title: string = ''
  let leader: string = ''
  let description: string = ''
  const keywords: string = ''

  const data: any = {} // TODO: figure this out

  if (collectionConfig) {
    const useAsTitle = collectionConfig?.admin?.useAsTitle || 'id'
    const entityLabel = getTranslation(collectionConfig.labels.singular, i18n)
    const titleFromData = data?.[useAsTitle]
    leader = entityLabel
    title = `${t('version:versions')}${titleFromData ? ` - ${titleFromData}` : ''} - ${getTranslation(collectionConfig.labels.plural, i18n)}`
    description = t('version:viewingVersions', {
      documentTitle: data?.[useAsTitle],
      entitySlug: collectionConfig.slug,
    })
  }

  if (globalConfig) {
    const entityLabel = getTranslation(globalConfig.label, i18n)
    leader = entityLabel
    title = `${t('version:versions')} - ${getTranslation(globalConfig.label, i18n)}`
    description = t('version:viewingVersionsGlobal', { entitySlug: globalConfig.slug })
  }

  return meta({
    config,
    description,
    keywords,
    leader,
    title,
  })
}
