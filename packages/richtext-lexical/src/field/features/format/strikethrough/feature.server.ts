import type { FeatureProviderProviderServer } from '../../types.js'

// eslint-disable-next-line payload/no-imports-from-exports-dir
import { StrikethroughFeatureClientComponent } from '../../../../exports/client/index.js'
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
