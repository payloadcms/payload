import type { Metadata } from 'next'

import { getTranslation } from '@payloadcms/translations'
import { formatDate } from '@payloadcms/ui'

import type { GenerateEditViewMetadata } from '../Document'

import { getNextI18n } from '../../utilities/getNextI18n'
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

  const i18n = await getNextI18n({
    config,
  })

  const doc: any = {} // TODO: figure this out

  const formattedCreatedAt = doc?.createdAt
    ? formatDate(doc.createdAt, config?.admin?.dateFormat, i18n?.language)
    : ''

  if (collectionConfig) {
    const useAsTitle = collectionConfig?.admin?.useAsTitle || 'id'
    const entityLabel = getTranslation(collectionConfig.labels.singular, i18n)
    title = `${t('version:version')} - ${formattedCreatedAt} - ${doc[useAsTitle]} - ${entityLabel}`
    description = t('version:viewingVersion', { documentTitle: doc[useAsTitle], entityLabel })
  }

  if (globalConfig) {
    const entityLabel = getTranslation(globalConfig.label, i18n)
    title = `${t('version:version')} - ${formattedCreatedAt} - ${entityLabel}`
    description = t('version:viewingVersionGlobal', { entityLabel })
  }

  return meta({
    config,
    description,
    keywords,
    title,
  })
}
