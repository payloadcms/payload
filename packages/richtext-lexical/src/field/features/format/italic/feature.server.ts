import type { FeatureProviderProviderServer } from '../../types.js'

import { ItalicFeatureClientComponent } from './feature.client.js'
import { ITALIC_STAR, ITALIC_UNDERSCORE } from './markdownTransformers.js'

export const ItalicFeature: FeatureProviderProviderServer<undefined, undefined> = (props) => {
  return {
    feature: () => {
      return {
        ClientComponent: ItalicFeatureClientComponent,
        markdownTransformers: [ITALIC_STAR, ITALIC_UNDERSCORE],
        serverFeatureProps: props,
      }
    },
    key: 'italic',
    serverFeatureProps: props,
  }
}
