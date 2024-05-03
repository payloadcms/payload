import type { FeatureProviderProviderServer } from '../../types.js'

import { TreeViewFeatureClientComponent } from './feature.client.js'

export const TreeViewFeature: FeatureProviderProviderServer<undefined, undefined> = (props) => {
  return {
    feature: () => {
      return {
        ClientComponent: TreeViewFeatureClientComponent,
        serverFeatureProps: props,
      }
    },
    key: 'treeView',
    serverFeatureProps: props,
  }
}
