import { createServerFeature } from '../../../../utilities/createServerFeature.js'

export const TreeViewFeature = createServerFeature({
  feature: {
    ClientFeature: '@ruya.sa/richtext-lexical/client#TreeViewFeatureClient',
  },
  key: 'treeView',
})
