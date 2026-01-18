import { createServerFeature } from '../../../../utilities/createServerFeature.js'

export const TreeViewFeature = createServerFeature({
  feature: {
    ClientFeature: '@payloadcms/richtext-lexical/client#TreeViewFeatureClient',
  },
  key: 'treeView',
})
