// eslint-disable-next-line payload/no-imports-from-exports-dir
import { ItalicFeatureClient } from '../../../exports/client/index.js'
import { createServerFeature } from '../../../utilities/createServerFeature.js'
import { ITALIC_STAR, ITALIC_UNDERSCORE } from './markdownTransformers.js'

export const ItalicFeature = createServerFeature({
  feature: {
    ClientFeature: ItalicFeatureClient,
    markdownTransformers: [ITALIC_STAR, ITALIC_UNDERSCORE],
  },
  key: 'italic',
})
