'use client'
import type { FeatureProviderProviderClient } from '../../types.js'

import { createClientComponent } from '../../createClientComponent.js'
import { TreeViewPlugin } from './plugin/index.js'

const TreeViewFeatureClient: FeatureProviderProviderClient<undefined> = (props) => {
  return {
    clientFeatureProps: props,
    feature: () => ({
      clientFeatureProps: props,
      plugins: [
        {
          Component: TreeViewPlugin,
          position: 'bottom',
        },
      ],
    }),
  }
}

export const TreeViewFeatureClientComponent = createClientComponent(TreeViewFeatureClient)
