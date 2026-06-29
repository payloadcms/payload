import { ITALIC_STAR, ITALIC_UNDERSCORE } from '@lexical/markdown'

import { createServerFeature } from '../../../utilities/createServerFeature.js'

export const ItalicFeature = createServerFeature({
  feature: {
    ClientFeature: '@payloadcms/richtext-lexical/client#ItalicFeatureClient',
    markdownTransformers: [ITALIC_STAR, ITALIC_UNDERSCORE],
  },
  key: 'italic',
})
