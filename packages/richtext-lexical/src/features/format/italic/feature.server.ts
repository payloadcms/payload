import { ITALIC_STAR, ITALIC_UNDERSCORE } from '@lexical/markdown'

import { createServerFeature } from '../../../utilities/createServerFeature.js'
import { i18n } from './i18n.js'

export const ItalicFeature = createServerFeature({
  feature: {
    ClientFeature: '@payloadcms/richtext-lexical/client#ItalicFeatureClient',
    i18n,
    markdownTransformers: [ITALIC_STAR, ITALIC_UNDERSCORE],
  },
  key: 'italic',
})
