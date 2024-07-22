import { createServerFeature } from '../../../utilities/createServerFeature.js'

export const InlineToolbarFeature = createServerFeature({
  feature: {
    ClientFeature: '../../../exports/client/index.js#InlineToolbarFeatureClient',
  },
  key: 'toolbarInline',
})
