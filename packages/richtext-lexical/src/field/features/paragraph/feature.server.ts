import type { FeatureProviderProviderServer } from '../types.js'

// eslint-disable-next-line payload/no-imports-from-exports-dir
import { ParagraphFeatureClientComponent } from '../../../exports/client/index.js'
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
