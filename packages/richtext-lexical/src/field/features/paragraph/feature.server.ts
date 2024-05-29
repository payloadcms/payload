import type { FeatureProviderProviderServer } from '../types.js'

import { ParagraphFeatureClientComponent } from './feature.client.js'
import { i18n } from './i18n.js'

export const ParagraphFeature: FeatureProviderProviderServer<undefined, undefined> = (props) => {
  return {
    feature: () => {
      return {
        ClientComponent: ParagraphFeatureClientComponent,
        clientFeatureProps: null,
        i18n,
        serverFeatureProps: props,
      }
    },
    key: 'paragraph',
    serverFeatureProps: props,
  }
}
