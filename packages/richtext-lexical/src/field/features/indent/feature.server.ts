import type { FeatureProviderProviderServer } from '../types'

import { IndentFeatureClientComponent } from './feature.client'

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
