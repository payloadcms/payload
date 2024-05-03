import type { FeatureProviderProviderServer } from '../../types.js'

import { InlineToolbarFeatureClientComponent } from './feature.client.js'

export const InlineToolbarFeature: FeatureProviderProviderServer<undefined, undefined> = (
  props,
) => {
  return {
    feature: () => {
      return {
        ClientComponent: InlineToolbarFeatureClientComponent,
        clientFeatureProps: null,
        serverFeatureProps: props,
      }
    },
    key: 'toolbarInline',
    serverFeatureProps: props,
  }
}
