import type { FeatureProviderProviderServer } from '../../types'

import { SuperscriptFeatureClientComponent } from './feature.client'

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
