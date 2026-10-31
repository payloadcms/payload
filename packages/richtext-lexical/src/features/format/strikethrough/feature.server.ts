import { STRIKETHROUGH } from '@lexical/markdown'

import { createServerFeature } from '../../../utilities/createServerFeature.js'
import { i18n } from './i18n.js'

export const StrikethroughFeature = createServerFeature({
  feature: {
    ClientFeature: '@payloadcms/richtext-lexical/client#StrikethroughFeatureClient',
    i18n,

    markdownTransformers: [STRIKETHROUGH],
  },
  key: 'strikethrough',
})
