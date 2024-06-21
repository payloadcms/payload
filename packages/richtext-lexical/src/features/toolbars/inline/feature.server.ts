import type { FeatureProviderProviderServer } from '../../types.js'

// eslint-disable-next-line payload/no-imports-from-exports-dir
import { InlineToolbarFeatureClientComponent } from '../../../exports/client/index.js'

export const InlineToolbarFeature: FeatureProviderProviderServer<undefined, undefined> = (
  props,
) => {
  return {
    feature: {
      ClientFeature: InlineToolbarFeatureClientComponent,
      sanitizedServerFeatureProps: props,
    },
    key: 'toolbarInline',
    serverFeatureProps: props,
  }
}
