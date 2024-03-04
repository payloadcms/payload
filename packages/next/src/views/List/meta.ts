import { meta } from '../../utilities/meta'
import { getTranslation } from '@payloadcms/translations'
import { GenerateViewMetadata } from '../Root'
import { Metadata } from 'next'
import { SanitizedCollectionConfig } from 'payload/types'

export const generateListMetadata = async (
  args: Parameters<GenerateViewMetadata>[0] & {
    collectionConfig: SanitizedCollectionConfig
  },
): Promise<Metadata> => {
  const { collectionConfig, config, i18n } = args

  let title: string = ''
  const description: string = ''
  const keywords: string = ''

  if (collectionConfig) {
    title = getTranslation(collectionConfig.labels.plural, i18n)
  }

  return meta({
    config,
    description,
    keywords,
    title,
  })
}
