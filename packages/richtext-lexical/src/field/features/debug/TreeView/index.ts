import type { FeatureProvider } from '../../types'

import './index.scss'
import { TreeViewPlugin } from './plugin'

export const TreeviewFeature = (): FeatureProvider => {
  return {
    feature: ({ resolvedFeatures, unsanitizedEditorConfig }) => {
      return {
        plugins: [
          {
            Component: TreeViewPlugin,
            position: 'bottom',
          },
        ],
        props: null,
      }
    },
    key: 'debug-treeview',
  }
}
