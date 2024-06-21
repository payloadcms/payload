// eslint-disable-next-line payload/no-imports-from-exports-dir
import { StrikethroughFeatureClient } from '../../../exports/client/index.js'
import { createServerFeature } from '../../../utilities/createServerFeature.js'
import { STRIKETHROUGH } from './markdownTransformers.js'

export const StrikethroughFeature = createServerFeature({
  feature: {
    ClientFeature: StrikethroughFeatureClient,

    markdownTransformers: [STRIKETHROUGH],
  },
  key: 'strikethrough',
})
