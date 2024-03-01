import type { FeatureProviderProviderServer } from '../../types'

import { SubscriptFeatureClientComponent } from './feature.client'

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
