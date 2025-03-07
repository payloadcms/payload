import type { Metadata } from 'next'

import type { GenerateEditViewMetadata } from '../Document/getMetaBySegment.js'

import { generateEditViewMetadata } from '../Edit/metadata.js'

export const generateLivePreviewViewMetadata: GenerateEditViewMetadata = async ({
  collectionConfig,
  config,
  globalConfig,
  i18n,
  isEditing,
}): Promise<Metadata> =>
  generateEditViewMetadata({
    collectionConfig,
    config,
    globalConfig,
    i18n,
    isEditing,
    view: 'livePreview',
  })
