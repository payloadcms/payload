import type { FeatureProviderProviderServer } from '../types'

import { ParagraphFeatureClientComponent } from './feature.client'

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
