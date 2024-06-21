// eslint-disable-next-line payload/no-imports-from-exports-dir
import { TreeViewFeatureClient } from '../../../exports/client/index.js'
import { createServerFeature } from '../../../utilities/createServerFeature.js'

export const TreeViewFeature = createServerFeature({
  feature: {
    ClientFeature: TreeViewFeatureClient,
  },
  key: 'treeView',
})
