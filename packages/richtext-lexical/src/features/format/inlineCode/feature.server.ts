// eslint-disable-next-line payload/no-imports-from-exports-dir
import { InlineCodeFeatureClient } from '../../../exports/client/index.js'
import { createServerFeature } from '../../../utilities/createServerFeature.js'
import { INLINE_CODE } from './markdownTransformers.js'

export const InlineCodeFeature = createServerFeature({
  feature: {
    ClientFeature: InlineCodeFeatureClient,
    markdownTransformers: [INLINE_CODE],
  },
  key: 'inlineCode',
})
