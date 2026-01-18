import { createServerFeature } from '../../../utilities/createServerFeature.js'

export const SuperscriptFeature = createServerFeature({
  feature: {
    ClientFeature: '@ruya.sa/richtext-lexical/client#SuperscriptFeatureClient',
  },
  key: 'superscript',
})
