import { STRIKETHROUGH } from '@lexical/markdown'

import { createServerFeature } from '../../../utilities/createServerFeature.js'

export const StrikethroughFeature = createServerFeature({
  feature: {
    ClientFeature: '@payloadcms/richtext-lexical/client#StrikethroughFeatureClient',

    markdownTransformers: [STRIKETHROUGH],
  },
  key: 'strikethrough',
})
