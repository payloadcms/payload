import { createServerFeature } from '../../../utilities/createServerFeature.js'

export const UnderlineFeature = createServerFeature({
  feature: {
    ClientFeature: '@ruya.sa/richtext-lexical/client#UnderlineFeatureClient',
  },
  key: 'underline',
})
