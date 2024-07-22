import { createServerFeature } from '../../../utilities/createServerFeature.js'
import { INLINE_CODE } from './markdownTransformers.js'

export const InlineCodeFeature = createServerFeature({
  feature: {
    ClientFeature: '../../../exports/client/index.jsInlineCodeFeatureClient',
    markdownTransformers: [INLINE_CODE],
  },
  key: 'inlineCode',
})
