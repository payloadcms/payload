import { createServerFeature } from '../../../../utilities/createServerFeature.js'

export const InlineToolbarFeature = createServerFeature({
  feature: {
    ClientFeature: '@payloadcms/richtext-lexical/client#InlineToolbarFeatureClient',
  },
  key: 'toolbarInline',
})
