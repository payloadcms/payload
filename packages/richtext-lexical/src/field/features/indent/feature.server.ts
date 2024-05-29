import type { FeatureProviderProviderServer } from '../types.js'

import { IndentFeatureClientComponent } from './feature.client.js'
import { i18n } from './i18n.js'

export const IndentFeature: FeatureProviderProviderServer<undefined, undefined> = (props) => {
  return {
    feature: () => {
      return {
        ClientComponent: IndentFeatureClientComponent,
        clientFeatureProps: null,
        i18n,
        serverFeatureProps: props,
      }
    },
    key: 'indent',
    serverFeatureProps: props,
  }
}
