// eslint-disable-next-line payload/no-imports-from-exports-dir
import { SubscriptFeatureClient } from '../../../exports/client/index.js'
import { createServerFeature } from '../../../utilities/createServerFeature.js'

export const SubscriptFeature = createServerFeature({
  feature: {
    ClientFeature: SubscriptFeatureClient,
  },
  key: 'subscript',
})
