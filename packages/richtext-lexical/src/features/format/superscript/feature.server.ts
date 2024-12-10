import { createServerFeature } from '../../../utilities/createServerFeature.js'

export const SuperscriptFeature = createServerFeature({
  feature: {
    ClientFeature: '@payloadcms/richtext-lexical/client#SuperscriptFeatureClient',
  },
  key: 'superscript',
})
