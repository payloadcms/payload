import { createServerFeature } from '../../../utilities/createServerFeature.js'

export const UnderlineFeature = createServerFeature({
  feature: {
    ClientFeature: '@payloadcms/richtext-lexical/client#UnderlineFeatureClient',
  },
  key: 'underline',
})
