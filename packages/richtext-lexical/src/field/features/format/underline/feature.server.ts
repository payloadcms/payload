import type { FeatureProviderProviderServer } from '../../types.js'

import { UnderlineFeatureClientComponent } from './feature.client.js'

export const UnderlineFeature: FeatureProviderProviderServer<undefined, undefined> = (props) => {
  return {
    feature: () => {
      return {
        ClientComponent: UnderlineFeatureClientComponent,
        serverFeatureProps: props,
      }
    },
    key: 'underline',
    serverFeatureProps: props,
  }
}
