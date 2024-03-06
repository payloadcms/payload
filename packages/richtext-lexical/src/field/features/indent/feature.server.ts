import type { FeatureProviderProviderServer } from '../types.js'

import { IndentFeatureClientComponent } from './feature.client.js'

export const IndentFeature: FeatureProviderProviderServer<undefined, undefined> = (props) => {
  return {
    feature: () => {
      return {
        ClientComponent: IndentFeatureClientComponent,
        clientFeatureProps: null,
        serverFeatureProps: props,
      }
    },
    key: 'indent',
    serverFeatureProps: props,
  }
}
