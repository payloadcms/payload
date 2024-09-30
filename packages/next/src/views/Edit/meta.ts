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
  isEditing,
  view = 'default',
}): Promise<Metadata> => {
  const { t } = i18n

  const entityLabel = collectionConfig
    ? getTranslation(collectionConfig.labels.singular, i18n)
    : globalConfig
      ? getTranslation(globalConfig.label, i18n)
      : ''

  const metaToUse: MetaConfig = {
    ...(config.admin.meta || {}),
    description: `${isEditing ? t('general:editing') : t('general:creating')} - ${entityLabel}`,
    keywords: `${entityLabel}, Payload, CMS`,
    title: `${isEditing ? t('general:editing') : t('general:creating')} - ${entityLabel}`,
  }

  const ogToUse: MetaConfig['openGraph'] = {
    title: `${isEditing ? t('general:edit') : t('general:edit')} - ${entityLabel}`,
    ...(config.admin.meta.openGraph || {}),
    ...(collectionConfig
      ? {
          ...(collectionConfig?.admin.meta?.openGraph || {}),
          ...(collectionConfig?.admin?.components?.views?.edit?.[view]?.meta?.openGraph || {}),
        }
      : {}),
    ...(globalConfig
      ? {
          ...(globalConfig?.admin.meta?.openGraph || {}),
          ...(globalConfig?.admin?.components?.views?.edit?.[view]?.meta?.openGraph || {}),
        }
      : {}),
  }

  return meta({
    ...metaToUse,
    openGraph: ogToUse,
    ...(collectionConfig
      ? {
          ...(collectionConfig?.admin.meta || {}),
          ...(collectionConfig?.admin?.components?.views?.edit?.[view]?.meta || {}),
        }
      : {}),
    ...(globalConfig
      ? {
          ...(globalConfig?.admin.meta || {}),
          ...(globalConfig?.admin?.components?.views?.edit?.[view]?.meta || {}),
        }
      : {}),
    serverURL: config.serverURL,
  })
}
