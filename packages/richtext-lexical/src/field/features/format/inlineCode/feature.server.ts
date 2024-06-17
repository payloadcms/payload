import type { FeatureProviderProviderServer } from '../../types.js'

// eslint-disable-next-line payload/no-imports-from-exports-dir
import { InlineCodeFeatureClientComponent } from '../../../../exports/client/index.js'
import { INLINE_CODE } from './markdownTransformers.js'

export const InlineCodeFeature: FeatureProviderProviderServer<undefined, undefined> = (props) => {
  return {
    feature: () => {
      return {
        ClientComponent: InlineCodeFeatureClientComponent,
        markdownTransformers: [INLINE_CODE],
        serverFeatureProps: props,
      }
    },
    key: 'inlineCode',
    serverFeatureProps: props,
  }
}
