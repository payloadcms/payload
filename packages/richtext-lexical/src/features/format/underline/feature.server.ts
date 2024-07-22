import { createServerFeature } from '../../../utilities/createServerFeature.js'

export const UnderlineFeature = createServerFeature({
  feature: {
    ClientFeature: '../../../exports/client/index.js#UnderlineFeatureClient',
  },
  key: 'underline',
})
