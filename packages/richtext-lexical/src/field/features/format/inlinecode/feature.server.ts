import type { FeatureProviderProviderServer } from '../../types'

import { InlineCodeFeatureClientComponent } from './feature.client'
import { INLINE_CODE } from './markdownTransformers'

export const InlineCodeFeature: FeatureProviderProviderServer<undefined, undefined> = (props) => {
  return {
    feature: () => {
      return {
        ClientComponent: InlineCodeFeatureClientComponent,
        markdownTransformers: [INLINE_CODE],
        serverFeatureProps: props,
      }
    },
    key: 'inlinecode',
    serverFeatureProps: props,
  }
}
