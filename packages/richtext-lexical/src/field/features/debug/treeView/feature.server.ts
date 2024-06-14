import type { FeatureProviderProviderServer } from '../../types.js'

// eslint-disable-next-line payload/no-imports-from-exports-dir
import { TreeViewFeatureClientComponent } from '../../../../exports/client/index.js'

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
