import { getTranslation } from '@payloadcms/translations'

import type { GenerateEditViewMetadata } from '../Document/getMetaBySegment.js'

import { meta } from '../../utilities/meta.js'

export const generateMetadata: GenerateEditViewMetadata = async ({
  collectionConfig,
  config,
  globalConfig,
  i18n,
}) => {
  const entityLabel = collectionConfig
    ? getTranslation(collectionConfig.labels.singular, i18n)
    : globalConfig
      ? getTranslation(globalConfig.label, i18n)
      : ''

  return Promise.resolve(
    meta({
      ...(config.admin.meta || {}),
      description: `API - ${entityLabel}`,
      keywords: 'API',
      serverURL: config.serverURL,
      title: `API - ${entityLabel}`,
      ...(collectionConfig
        ? {
            ...(collectionConfig?.admin.meta || {}),
            ...(collectionConfig?.admin?.components?.views?.edit?.api?.meta || {}),
          }
        : {}),
      ...(globalConfig
        ? {
            ...(globalConfig?.admin.meta || {}),
            ...(globalConfig?.admin?.components?.views?.edit?.api?.meta || {}),
          }
        : {}),
    }),
  )
}
