import type { FeatureProviderProviderServer } from '../../types.js'

// eslint-disable-next-line payload/no-imports-from-exports-dir
import { UnderlineFeatureClientComponent } from '../../../../exports/client/index.js'

export const UnderlineFeature: FeatureProviderProviderServer<undefined, undefined> = (props) => {
  return {
    feature: () => {
      return {
        ClientComponent: UnderlineFeatureClientComponent,
        serverFeatureProps: props,
      }
    },
    key: 'underline',
    serverFeatureProps: props,
  }
}
