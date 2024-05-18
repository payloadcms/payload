import type { FeatureProviderProviderServer } from '../../types.js'

import { FixedToolbarFeatureClientComponent } from './feature.client.js'

export const FixedToolbarFeature: FeatureProviderProviderServer<undefined, undefined> = (props) => {
  return {
    feature: () => {
      return {
        ClientComponent: FixedToolbarFeatureClientComponent,
        serverFeatureProps: props,
      }
    },
    key: 'toolbarFixed',
    serverFeatureProps: props,
  }
}
