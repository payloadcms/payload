import type { Metadata } from 'next'

import type { GenerateEditViewMetadata } from '../Document'

import { meta } from '../../utilities/meta'

export const generateMetadata: GenerateEditViewMetadata = async ({
  collectionConfig,
  config,
  globalConfig,
  t,
}): Promise<Metadata> => {
  let title: string = ''
  let description: string = ''
  const keywords: string = ''

  const data: any = {} // TODO: figure this out

  if (collectionConfig) {
    const useAsTitle = collectionConfig?.admin?.useAsTitle || 'id'
    console.log('useAsTitle', useAsTitle)
    title = `${t('version:versions')} - ${data?.[useAsTitle]} - ${collectionConfig.slug}`
    description = t('version:viewingVersions', {
      documentTitle: data?.[useAsTitle],
      entitySlug: collectionConfig.slug,
    })
  }

  if (globalConfig) {
    title = `${t('version:versions')} - ${globalConfig.slug}`
    description = t('version:viewingVersionsGlobal', { entitySlug: globalConfig.slug })
  }

  return meta({
    config,
    description,
    keywords,
    title,
  })
}
