import type { Metadata } from 'next'
import type { MetaConfig } from 'payload'

import { getTranslation } from '@payloadcms/translations'

import type { GenerateEditViewMetadata } from '../Document/getMetaBySegment.js'

import { getAdminConfig } from '../../utilities/adminConfigCache.js'
import { generateMetadata } from '../../utilities/meta.js'

/**
 * @todo Remove the `MetaConfig` type assertions. They are currently required because of how the `Metadata` type from `next` consumes the `URL` type.
 */
export const generateVersionsViewMetadata: GenerateEditViewMetadata = async ({
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

  const adminConfig = getAdminConfig()

  if (collectionConfig) {
    const useAsTitle = collectionConfig?.admin?.useAsTitle || 'id'
    const titleFromData = data?.[useAsTitle]
    const adminVersionsMeta = (adminConfig.collections?.[collectionConfig.slug] as any)?.views?.edit
      ?.versions?.meta

    metaToUse = {
      ...(config.admin.meta || {}),
      description: t('version:viewingVersions', {
        documentTitle: data?.[useAsTitle],
        entitySlug: collectionConfig.slug,
      }),
      title: `${t('version:versions')}${titleFromData ? ` - ${titleFromData}` : ''} - ${entityLabel}`,
      ...(collectionConfig?.admin.meta || {}),
      ...(adminVersionsMeta ||
        collectionConfig?.admin?.components?.views?.edit?.versions?.meta ||
        {}),
    }
  }

  if (globalConfig) {
    const adminVersionsMeta = (adminConfig.globals?.[globalConfig.slug] as any)?.views?.edit
      ?.versions?.meta

    metaToUse = {
      ...(config.admin.meta || {}),
      description: t('version:viewingVersionsGlobal', { entitySlug: globalConfig.slug }),
      title: `${t('version:versions')} - ${entityLabel}`,
      ...((globalConfig?.admin.meta || {}) as MetaConfig),
      ...((adminVersionsMeta ||
        globalConfig?.admin?.components?.views?.edit?.versions?.meta ||
        {}) as MetaConfig),
    }
  }

  return generateMetadata({
    ...metaToUse,
    serverURL: config.serverURL,
  })
}
