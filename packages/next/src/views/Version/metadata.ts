import type { Metadata } from 'next'
import type { MetaConfig } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { formatDate } from '@payloadcms/ui/shared'

import type { GenerateEditViewMetadata } from '../Document/getMetaBySegment.js'

import { generateMetadata } from '../../utilities/meta.js'

/**
 * @todo Remove the `MetaConfig` type assertions. They are currently required because of how the `Metadata` type from `next` consumes the `URL` type.
 */
export const generateVersionViewMetadata: GenerateEditViewMetadata = async ({
  collectionConfig,
  config,
  globalConfig,
  i18n,
}): Promise<Metadata> => {
  const { t } = i18n

  let metaToUse: MetaConfig = {
    ...(config.admin.meta || {}),
  }

  const doc: any = {} // TODO: figure this out

  const formattedCreatedAt = doc?.createdAt
    ? formatDate({ date: doc.createdAt, i18n, pattern: config?.admin?.dateFormat })
    : ''

  if (collectionConfig) {
    const useAsTitle = collectionConfig?.admin?.useAsTitle || 'id'
    const entityLabel = getTranslation(collectionConfig.labels.singular, i18n)
    const titleFromData = doc?.[useAsTitle]

    metaToUse = {
      ...(config.admin.meta || {}),
      description: t('version:viewingVersion', { documentTitle: doc[useAsTitle], entityLabel }),
      title: `${t('version:version')}${formattedCreatedAt ? ` - ${formattedCreatedAt}` : ''}${titleFromData ? ` - ${titleFromData}` : ''} - ${entityLabel}`,
      ...(collectionConfig?.admin?.meta || {}),
      ...(collectionConfig?.admin?.components?.views?.edit?.version?.meta || {}),
    }
  }

  if (globalConfig) {
    const entityLabel = getTranslation(globalConfig.label, i18n)

    metaToUse = {
      ...(config.admin.meta || {}),
      description: t('version:viewingVersionGlobal', { entityLabel }),
      title: `${t('version:version')}${formattedCreatedAt ? ` - ${formattedCreatedAt}` : ''}${entityLabel}`,
      ...((globalConfig?.admin?.meta || {}) as MetaConfig),
      ...((globalConfig?.admin?.components?.views?.edit?.version?.meta || {}) as MetaConfig),
    }
  }

  return generateMetadata({
    ...metaToUse,
    serverURL: config.serverURL,
  })
}
