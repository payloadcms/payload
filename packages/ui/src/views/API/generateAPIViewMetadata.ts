import type { I18nClient } from '@payloadcms/translations'
import type {
  EditConfig,
  MetaConfig,
  SanitizedCollectionConfig,
  SanitizedConfig,
  SanitizedGlobalConfig,
} from 'payload'

import { getTranslation } from '@payloadcms/translations'

import { formatMetadata } from '../../utilities/formatMetadata.js'

export type GenerateEditViewMetadata = (args: {
  collectionConfig?: null | SanitizedCollectionConfig
  config: SanitizedConfig
  globalConfig?: null | SanitizedGlobalConfig
  i18n: I18nClient
  isEditing?: boolean
  isReadOnly?: boolean
  params?: { [key: string]: string | string[] }
  view?: keyof EditConfig
}) => Promise<MetaConfig>

/**
 * @todo Remove the `MetaConfig` type assertions. They are currently required because of how the `Metadata` type from `next` consumes the `URL` type.
 */
export const generateAPIViewMetadata: GenerateEditViewMetadata = async ({
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
    formatMetadata({
      ...(config.admin.meta || {}),
      description: `API - ${entityLabel}`,
      keywords: 'API',
      serverURL: config.serverURL,
      title: `API - ${entityLabel}`,
      ...((collectionConfig
        ? {
            ...(collectionConfig?.admin.meta || {}),
            ...(collectionConfig?.admin?.components?.views?.edit?.api?.meta || {}),
          }
        : {}) as MetaConfig),
      ...((globalConfig
        ? {
            ...(globalConfig?.admin.meta || {}),
            ...(globalConfig?.admin?.components?.views?.edit?.api?.meta || {}),
          }
        : {}) as MetaConfig),
    }),
  )
}
