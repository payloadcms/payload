import type { FeatureProviderProviderServer } from '../../types'

import { StrikethroughFeatureClientComponent } from './feature.client'
import { STRIKETHROUGH } from './markdownTransformers'

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
