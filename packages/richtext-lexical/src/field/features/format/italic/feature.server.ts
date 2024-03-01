import type { FeatureProviderProviderServer } from '../../types'

import { ItalicFeatureClientComponent } from './feature.client'
import { ITALIC_STAR, ITALIC_UNDERSCORE } from './markdownTransformers'

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
