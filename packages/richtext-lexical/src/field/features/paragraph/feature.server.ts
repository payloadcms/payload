import type { FeatureProviderProviderServer } from '../types.js'

import { ParagraphFeatureClientComponent } from './feature.client.js'

export const ParagraphFeature: FeatureProviderProviderServer<undefined, undefined> = (props) => {
  return {
    feature: () => {
      return {
        ClientComponent: ParagraphFeatureClientComponent,
        clientFeatureProps: null,
        serverFeatureProps: props,
      }
    },
    key: 'paragraph',
    serverFeatureProps: props,
  }
}
