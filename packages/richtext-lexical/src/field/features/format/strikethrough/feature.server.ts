import type { FeatureProviderProviderServer } from '../../types.js'

import { StrikethroughFeatureClientComponent } from './feature.client.js'
import { STRIKETHROUGH } from './markdownTransformers.js'

export const StrikethroughFeature: FeatureProviderProviderServer<undefined, undefined> = (
  props,
) => {
  return {
    feature: () => {
      return {
        ClientComponent: StrikethroughFeatureClientComponent,

        markdownTransformers: [STRIKETHROUGH],
        serverFeatureProps: props,
      }
    },
    key: 'strikethrough',
    serverFeatureProps: props,
  }
}
