import type { FeatureProviderProviderServer } from '../types.js'

import { AlignFeatureClientComponent } from './feature.client.js'
import { i18n } from './i18n.js'

export const AlignFeature: FeatureProviderProviderServer<undefined, undefined> = (props) => {
  return {
    feature: () => {
      return {
        ClientComponent: AlignFeatureClientComponent,
        clientFeatureProps: null,
        i18n,
        serverFeatureProps: props,
      }
    },
    key: 'align',
    serverFeatureProps: props,
  }
}
