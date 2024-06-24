import type { FeatureProviderProviderServer } from '../types.js'

import { AlignFeatureClientComponent } from './feature.client.js'

export const AlignFeature: FeatureProviderProviderServer<undefined, undefined> = (props) => {
  return {
    feature: () => {
      return {
        ClientComponent: AlignFeatureClientComponent,
        clientFeatureProps: null,
        serverFeatureProps: props,
      }
    },
    key: 'align',
    serverFeatureProps: props,
  }
}
