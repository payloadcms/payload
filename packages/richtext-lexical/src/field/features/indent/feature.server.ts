import type { FeatureProviderProviderServer } from '../types.js'

// eslint-disable-next-line payload/no-imports-from-exports-dir
import { IndentFeatureClientComponent } from '../../../exports/client/index.js'
import { i18n } from './i18n.js'

export const IndentFeature: FeatureProviderProviderServer<undefined, undefined> = (props) => {
  return {
    feature: () => {
      return {
        ClientComponent: IndentFeatureClientComponent,
        clientFeatureProps: null,
        i18n,
        serverFeatureProps: props,
      }
    },
    key: 'indent',
    serverFeatureProps: props,
  }
}
