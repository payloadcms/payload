import { createServerFeature } from '../../../../utilities/createServerFeature.js'

export const InlineToolbarFeature = createServerFeature({
  feature: {
    ClientFeature: '@ruya.sa/richtext-lexical/client#InlineToolbarFeatureClient',
  },
  key: 'toolbarInline',
})
