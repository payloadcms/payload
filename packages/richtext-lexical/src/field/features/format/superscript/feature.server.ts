import type { FeatureProviderProviderServer } from '../../types.js'

// eslint-disable-next-line payload/no-imports-from-exports-dir
import { SuperscriptFeatureClientComponent } from '../../../../exports/client/index.js'

export const SuperscriptFeature: FeatureProviderProviderServer<undefined, undefined> = (props) => {
  return {
    feature: () => {
      return {
        ClientComponent: SuperscriptFeatureClientComponent,
        serverFeatureProps: props,
      }
    },
    key: 'superscript',
    serverFeatureProps: props,
  }
}
