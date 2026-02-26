import type { Metadata } from 'next'
import type { MetaConfig } from 'payload'

import { getTranslation } from '@payloadcms/translations'

import type { GenerateEditViewMetadata } from '../Document/getMetaBySegment.js'

import { getAdminConfig } from '../../utilities/adminConfigCache.js'
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
  isReadOnly = false,
  view = 'default',
}): Promise<Metadata> => {
  const { t } = i18n

  const entityLabel = collectionConfig
    ? getTranslation(collectionConfig.labels.singular, i18n)
    : globalConfig
      ? getTranslation(globalConfig.label, i18n)
      : ''

  const verb = isReadOnly
    ? t('general:viewing')
    : isEditing
      ? t('general:editing')
      : t('general:creating')

  const metaToUse: MetaConfig = {
    ...(config.admin.meta || {}),
    description: `${verb} - ${entityLabel}`,
    keywords: `${entityLabel}, Payload, CMS`,
    title: `${verb} - ${entityLabel}`,
  }

  const adminConfig = getAdminConfig()
  const slug = collectionConfig?.slug ?? globalConfig?.slug
  const adminViewMeta = slug
    ? ((collectionConfig ? adminConfig.collections?.[slug] : adminConfig.globals?.[slug]) as any)
        ?.views?.edit?.[view]?.meta
    : undefined

  const getViewMeta = () =>
    adminViewMeta ||
    collectionConfig?.admin?.components?.views?.edit?.[view]?.meta ||
    globalConfig?.admin?.components?.views?.edit?.[view]?.meta ||
    {}

  const viewMeta = getViewMeta()

  const ogToUse: MetaConfig['openGraph'] = {
    title: `${isEditing ? t('general:edit') : t('general:edit')} - ${entityLabel}`,
    ...(config.admin.meta.openGraph || {}),
    ...((collectionConfig
      ? {
          ...(collectionConfig?.admin.meta?.openGraph || {}),
          ...(viewMeta?.openGraph || {}),
        }
      : {}) as MetaConfig['openGraph']),
    ...((globalConfig
      ? {
          ...(globalConfig?.admin.meta?.openGraph || {}),
          ...(viewMeta?.openGraph || {}),
        }
      : {}) as MetaConfig['openGraph']),
  }

  return generateMetadata({
    ...metaToUse,
    openGraph: ogToUse,
    ...((collectionConfig
      ? {
          ...(collectionConfig?.admin.meta || {}),
          ...viewMeta,
        }
      : {}) as MetaConfig),
    ...((globalConfig
      ? {
          ...(globalConfig?.admin.meta || {}),
          ...viewMeta,
        }
      : {}) as MetaConfig),
    serverURL: config.serverURL,
  })
}
