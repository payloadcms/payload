import { createServerFeature } from '../../../utilities/createServerFeature.js'
import { STRIKETHROUGH } from './markdownTransformers.js'

export const StrikethroughFeature = createServerFeature({
  feature: {
    ClientFeature: '../../../exports/client/index.js#StrikethroughFeatureClient',

    markdownTransformers: [STRIKETHROUGH],
  },
  key: 'strikethrough',
})
