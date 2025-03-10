import type { Metadata } from 'next'
import type { MetaConfig } from 'payload'

import { getTranslation } from '@payloadcms/translations'

import type { GenerateEditViewMetadata } from '../Document/getMetaBySegment.js'

import { generateMetadata } from '../../utilities/meta.js'

/**
 * @todo Remove the type assertion. This is currently required because of how the `Metadata` type from `next` consumes the `URL` type.
 */
export const generateEditViewMetadata: GenerateEditViewMetadata = async ({
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
    ...((collectionConfig
      ? {
          ...(collectionConfig?.admin.meta?.openGraph || {}),
          ...(collectionConfig?.admin?.components?.views?.edit?.[view]?.meta?.openGraph || {}),
        }
      : {}) as MetaConfig['openGraph']),
    ...((globalConfig
      ? {
          ...(globalConfig?.admin.meta?.openGraph || {}),
          ...(globalConfig?.admin?.components?.views?.edit?.[view]?.meta?.openGraph || {}),
        }
      : {}) as MetaConfig['openGraph']),
  }

  return generateMetadata({
    ...metaToUse,
    openGraph: ogToUse,
    ...((collectionConfig
      ? {
          ...(collectionConfig?.admin.meta || {}),
          ...(collectionConfig?.admin?.components?.views?.edit?.[view]?.meta || {}),
        }
      : {}) as MetaConfig),
    ...((globalConfig
      ? {
          ...(globalConfig?.admin.meta || {}),
          ...(globalConfig?.admin?.components?.views?.edit?.[view]?.meta || {}),
        }
      : {}) as MetaConfig),
    serverURL: config.serverURL,
  })
}
