import { INLINE_CODE } from '@lexical/markdown'

import { createServerFeature } from '../../../utilities/createServerFeature.js'

export const InlineCodeFeature = createServerFeature({
  feature: {
    ClientFeature: '@payloadcms/richtext-lexical/client#InlineCodeFeatureClient',
    markdownTransformers: [INLINE_CODE],
  },
  key: 'inlineCode',
})
