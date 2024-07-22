import { createServerFeature } from '../../../utilities/createServerFeature.js'

export const TreeViewFeature = createServerFeature({
  feature: {
    ClientFeature: '../../../exports/client/index.js#TreeViewFeatureClient',
  },
  key: 'treeView',
})
