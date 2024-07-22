import { createServerFeature } from '../../../utilities/createServerFeature.js'

export const SuperscriptFeature = createServerFeature({
  feature: {
    ClientFeature: '../../../exports/client/index.js#SuperscriptFeatureClient',
  },
  key: 'superscript',
})
