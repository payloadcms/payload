import { createServerFeature } from '../../../utilities/createServerFeature.js'
import { ITALIC_STAR, ITALIC_UNDERSCORE } from './markdownTransformers.js'

export const ItalicFeature = createServerFeature({
  feature: {
    ClientFeature: '../../../exports/client/index.js#ItalicFeatureClient',
    markdownTransformers: [ITALIC_STAR, ITALIC_UNDERSCORE],
  },
  key: 'italic',
})
