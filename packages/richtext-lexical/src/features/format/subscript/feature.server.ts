import { createServerFeature } from '../../../utilities/createServerFeature.js'

export const SubscriptFeature = createServerFeature({
  feature: {
    ClientFeature: '../../../exports/client/index.js#SubscriptFeatureClient',
  },
  key: 'subscript',
})
