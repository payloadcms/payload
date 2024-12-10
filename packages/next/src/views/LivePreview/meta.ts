import type { Metadata } from 'next'

import type { GenerateEditViewMetadata } from '../Document/getMetaBySegment.js'

import { generateMetadata as generateDocumentMetadata } from '../Edit/meta.js'

export const generateMetadata: GenerateEditViewMetadata = async ({
  collectionConfig,
  config,
  globalConfig,
  i18n,
  isEditing,
}): Promise<Metadata> =>
  generateDocumentMetadata({
    collectionConfig,
    config,
    globalConfig,
    i18n,
    isEditing,
    view: 'livePreview',
  })
