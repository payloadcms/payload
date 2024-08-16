import type { Metadata } from 'next'
import type { MetaConfig } from 'payload'

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

  let metaToUse: MetaConfig = {
    ...(config.admin.meta || {}),
  }

  const data: any = {} // TODO: figure this out

  if (collectionConfig) {
    const useAsTitle = collectionConfig?.admin?.useAsTitle || 'id'
    const titleFromData = data?.[useAsTitle]

    metaToUse = {
      ...(config.admin.meta || {}),
      description: t('version:viewingVersions', {
        documentTitle: data?.[useAsTitle],
        entitySlug: collectionConfig.slug,
      }),
      title: `${t('version:versions')}${titleFromData ? ` - ${titleFromData}` : ''} - ${entityLabel}`,
      ...(collectionConfig?.admin.meta || {}),
      ...(collectionConfig?.admin?.components?.views?.edit?.versions?.meta || {}),
    }
  }

  if (globalConfig) {
    metaToUse = {
      ...(config.admin.meta || {}),
      description: t('version:viewingVersionsGlobal', { entitySlug: globalConfig.slug }),
      title: `${t('version:versions')} - ${entityLabel}`,
      ...(globalConfig?.admin.meta || {}),
      ...(globalConfig?.admin?.components?.views?.edit?.versions?.meta || {}),
    }
  }

  return meta({
    ...metaToUse,
    serverURL: config.serverURL,
  })
}
