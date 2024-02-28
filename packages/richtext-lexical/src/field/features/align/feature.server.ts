import type { FeatureProviderProviderServer } from '../types'

import { AlignFeatureClientComponent } from './feature.client'

export const AlignFeature: FeatureProviderProviderServer<null, null> = (props) => {
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
