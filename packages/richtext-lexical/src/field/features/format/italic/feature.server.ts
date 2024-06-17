import type { FeatureProviderProviderServer } from '../../types.js'

// eslint-disable-next-line payload/no-imports-from-exports-dir
import { ItalicFeatureClientComponent } from '../../../../exports/client/index.js'
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
