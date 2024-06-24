import type { FeatureProviderProviderServer } from '../../types.js'

import { SuperscriptFeatureClientComponent } from './feature.client.js'

export const SuperscriptFeature: FeatureProviderProviderServer<undefined, undefined> = (props) => {
  return {
    feature: () => {
      return {
        ClientComponent: SuperscriptFeatureClientComponent,
        serverFeatureProps: props,
      }
    },
    key: 'superscript',
    serverFeatureProps: props,
  }
}
