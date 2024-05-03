import type { FeatureProviderProviderServer } from '../../types.js'

import { InlineCodeFeatureClientComponent } from './feature.client.js'
import { INLINE_CODE } from './markdownTransformers.js'

export const InlineCodeFeature: FeatureProviderProviderServer<undefined, undefined> = (props) => {
  return {
    feature: () => {
      return {
        ClientComponent: InlineCodeFeatureClientComponent,
        markdownTransformers: [INLINE_CODE],
        serverFeatureProps: props,
      }
    },
    key: 'inlineCode',
    serverFeatureProps: props,
  }
}
