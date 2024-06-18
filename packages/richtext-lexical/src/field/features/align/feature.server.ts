import type { FeatureProviderProviderServer } from '../types.js'

// eslint-disable-next-line payload/no-imports-from-exports-dir
import { AlignFeatureClientComponent } from '../../../exports/client/index.js'
import { i18n } from './i18n.js'

export const AlignFeature: FeatureProviderProviderServer<undefined, undefined> = (props) => {
  return {
    feature: () => {
      return {
        ClientComponent: AlignFeatureClientComponent,
        clientFeatureProps: null,
        i18n,
        serverFeatureProps: props,
      }
    },
    key: 'align',
    serverFeatureProps: props,
  }
}
