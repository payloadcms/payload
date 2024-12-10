import { createServerFeature } from '../../../utilities/createServerFeature.js'

export const SubscriptFeature = createServerFeature({
  feature: {
    ClientFeature: '@payloadcms/richtext-lexical/client#SubscriptFeatureClient',
  },
  key: 'subscript',
})
