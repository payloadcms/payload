import type { FeatureProviderProviderServer } from '../../types'

import { TreeViewFeatureClientComponent } from './feature.client'

export const TreeViewFeature: FeatureProviderProviderServer<undefined, undefined> = (props) => {
  return {
    feature: () => {
      return {
        ClientComponent: TreeViewFeatureClientComponent,
        serverFeatureProps: props,
      }
    },
    key: 'treeview',
    serverFeatureProps: props,
  }
}
