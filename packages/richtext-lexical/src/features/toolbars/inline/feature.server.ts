// eslint-disable-next-line payload/no-imports-from-exports-dir
import { InlineToolbarFeatureClient } from '../../../exports/client/index.js'
import { createServerFeature } from '../../../utilities/createServerFeature.js'

export const InlineToolbarFeature = createServerFeature({
  feature: {
    ClientFeature: InlineToolbarFeatureClient,
  },
  key: 'toolbarInline',
})
