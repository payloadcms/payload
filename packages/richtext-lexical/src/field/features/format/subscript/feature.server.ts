import type { FeatureProviderProviderServer } from '../../types.js'

import { SubscriptFeatureClientComponent } from './feature.client.js'

export const SubscriptFeature: FeatureProviderProviderServer<undefined, undefined> = (props) => {
  return {
    feature: () => {
      return {
        ClientComponent: SubscriptFeatureClientComponent,
        serverFeatureProps: props,
      }
    },
    key: 'subscript',
    serverFeatureProps: props,
  }
}
