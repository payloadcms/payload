import type { FeatureProviderProviderServer } from '../../types'

import { UnderlineFeatureClientComponent } from './feature.client'

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
