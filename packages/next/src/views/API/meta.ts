import { getTranslation } from '@payloadcms/translations'

import type { GenerateEditViewMetadata } from '../Document/getMetaBySegment.js'

import { meta } from '../../utilities/meta.js'

export const generateMetadata: GenerateEditViewMetadata = async ({
  collectionConfig,
  config,
  globalConfig,
  i18n,
}) => {
  let leader: string = ''

  if (collectionConfig) {
    const entityLabel = getTranslation(collectionConfig.labels.singular, i18n)
    leader = entityLabel
  }

  if (globalConfig) {
    const entityLabel = getTranslation(globalConfig.label, i18n)
    leader = entityLabel
  }

  return Promise.resolve(
    meta({
      config,
      description: 'API',
      keywords: 'API',
      leader,
      title: 'API',
    }),
  )
}
