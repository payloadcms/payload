import type { FeatureProviderProviderServer } from '../../types.js'

// eslint-disable-next-line payload/no-imports-from-exports-dir
import { SubscriptFeatureClientComponent } from '../../../../exports/client/index.js'

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
